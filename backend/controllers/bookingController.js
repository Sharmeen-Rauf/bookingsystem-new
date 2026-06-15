const mongoose = require('mongoose');
const Stripe = require('stripe');
const Booking = require('../models/Booking');
const BoothPackage = require('../models/BoothPackage');
const AddOn = require('../models/AddOn');
const User = require('../models/User');

// Initialize Stripe if secret key is present in environment variables
const stripe = process.env.STRIPE_SECRET_KEY ? Stripe(process.env.STRIPE_SECRET_KEY) : null;

// Helper: Convert HH:MM time string to minutes from midnight (e.g. "14:30" -> 870)
const timeToMinutes = (timeStr) => {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
};

// Helper: Compute Live Pricing Breakdown
const computePricing = async (packageId, addOnIds = []) => {
  // 1. Fetch package base cost
  const boothPackage = await BoothPackage.findById(packageId);
  if (!boothPackage) {
    throw new Error('Selected package not found');
  }
  const baseCost = boothPackage.basePrice;

  // 2. Fetch and sum addons
  let addOnsTotalCost = 0;
  let addOnsList = [];
  if (addOnIds && addOnIds.length > 0) {
    // Validate object IDs
    const validAddOnIds = addOnIds.filter(id => mongoose.Types.ObjectId.isValid(id));
    const addOns = await AddOn.find({ _id: { $in: validAddOnIds } });
    addOnsList = addOns;
    addOnsTotalCost = addOns.reduce((sum, addOn) => sum + addOn.price, 0);
  }

  // 3. Calculate Tax (e.g., 8.25% sales tax)
  const TAX_RATE = 0.0825;
  const subtotal = baseCost + addOnsTotalCost;
  const tax = Math.round(subtotal * TAX_RATE * 100) / 100;

  // 4. Calculate Grand Total
  const grandTotal = Math.round((subtotal + tax) * 100) / 100;

  return {
    baseCost,
    addOnsTotalCost,
    tax,
    grandTotal,
    boothPackage,
    addOnsList
  };
};

/**
 * @desc    Check booking availability for a date and time slot
 * @route   POST /api/bookings/availability
 * @access  Public
 */
const checkAvailability = async (req, res) => {
  try {
    const { date, startTime, endTime } = req.body;

    if (!date || !startTime || !endTime) {
      return res.status(400).json({
        success: false,
        message: 'Please provide event date, startTime, and endTime',
      });
    }

    // Parse date range for the specified day
    const reqDate = new Date(date);
    if (isNaN(reqDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date format. Use YYYY-MM-DD.',
      });
    }

    const startOfDay = new Date(reqDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(reqDate.setHours(23, 59, 59, 999));

    // Convert requested slot to minutes
    const reqStartMin = timeToMinutes(startTime);
    const reqEndMin = timeToMinutes(endTime);

    if (reqStartMin >= reqEndMin) {
      return res.status(400).json({
        success: false,
        message: 'Start time must be before end time',
      });
    }

    // Query active bookings for the specified date
    // Active bookings are those that are NOT cancelled
    const bookingsOnDay = await Booking.find({
      'eventDetails.date': {
        $gte: startOfDay,
        $lte: endOfDay,
      },
      bookingStatus: { $ne: 'cancelled' },
      paymentStatus: { $ne: 'failed' },
    });

    // Filter overlapping bookings in JS for clean slot handling
    const overlappingBookings = bookingsOnDay.filter((booking) => {
      const bStartMin = timeToMinutes(booking.eventDetails.startTime);
      const bEndMin = timeToMinutes(booking.eventDetails.endTime);
      
      // Checking for overlaps: Max(Start1, Start2) < Min(End1, End2)
      return Math.max(reqStartMin, bStartMin) < Math.min(reqEndMin, bEndMin);
    });

    const TOTAL_BOOTHS = 3;
    const isAvailable = overlappingBookings.length < TOTAL_BOOTHS;

    if (!isAvailable) {
      return res.status(400).json({
        success: false,
        available: false,
        message: `Inventory capacity reached. All ${TOTAL_BOOTHS} booths are fully booked for this time slot.`,
      });
    }

    return res.status(200).json({
      success: true,
      available: true,
      message: 'Time slot is available!',
      activeBookingsCount: overlappingBookings.length,
      remainingBooths: TOTAL_BOOTHS - overlappingBookings.length,
    });
  } catch (error) {
    console.error('checkAvailability Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error checking availability',
      error: error.message,
    });
  }
};

/**
 * @desc    Calculate live total pricing and return price breakdown
 * @route   POST /api/bookings/price-breakdown
 * @access  Public
 */
const calculateTotalPricing = async (req, res) => {
  try {
    const { packageId, addOnIds } = req.body;

    if (!packageId) {
      return res.status(400).json({
        success: false,
        message: 'Package ID is required',
      });
    }

    if (!mongoose.Types.ObjectId.isValid(packageId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Package ID format',
      });
    }

    const priceBreakdown = await computePricing(packageId, addOnIds);

    return res.status(200).json({
      success: true,
      pricing: {
        baseCost: priceBreakdown.baseCost,
        addOnsTotalCost: priceBreakdown.addOnsTotalCost,
        tax: priceBreakdown.tax,
        grandTotal: priceBreakdown.grandTotal,
      },
      packageName: priceBreakdown.boothPackage.name,
      selectedAddOns: priceBreakdown.addOnsList.map(addon => ({
        id: addon._id,
        name: addon.name,
        price: addon.price
      }))
    });
  } catch (error) {
    console.error('calculateTotalPricing Error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error calculating pricing',
    });
  }
};

/**
 * @desc    Create pending booking and Stripe Checkout Session
 * @route   POST /api/bookings/checkout
 * @access  Public (Guest Checkout supported)
 */
const createBookingSession = async (req, res) => {
  try {
    const {
      customerDetails, // { name, email, phone }
      eventDetails,    // { date, startTime, endTime, eventType, venueAddress }
      packageId,
      addOnIds,
    } = req.body;

    // 1. Validations
    if (!eventDetails || !packageId || !customerDetails) {
      return res.status(400).json({
        success: false,
        message: 'Missing booking, event, or customer information',
      });
    }

    const { name, email, phone } = customerDetails;
    const { date, startTime, endTime, eventType, venueAddress } = eventDetails;

    if (!name || !email || !date || !startTime || !endTime || !eventType || !venueAddress) {
      return res.status(400).json({
        success: false,
        message: 'Please fill in all required fields',
      });
    }

    // 2. Manage/Resolve User (Guest checkout automatically creates user or queries existing)
    let user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      // Create a guest user with placeholder password
      const tempPassword = Math.random().toString(36).slice(-10);
      user = await User.create({
        name,
        email,
        phone,
        password: tempPassword,
        role: 'customer',
      });
    }

    // 3. Re-verify Availability to prevent double bookings
    const reqDate = new Date(date);
    const startOfDay = new Date(reqDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(reqDate.setHours(23, 59, 59, 999));
    const reqStartMin = timeToMinutes(startTime);
    const reqEndMin = timeToMinutes(endTime);

    const bookingsOnDay = await Booking.find({
      'eventDetails.date': { $gte: startOfDay, $lte: endOfDay },
      bookingStatus: { $ne: 'cancelled' },
      paymentStatus: { $ne: 'failed' },
    });

    const overlappingBookings = bookingsOnDay.filter((booking) => {
      const bStartMin = timeToMinutes(booking.eventDetails.startTime);
      const bEndMin = timeToMinutes(booking.eventDetails.endTime);
      return Math.max(reqStartMin, bStartMin) < Math.min(reqEndMin, bEndMin);
    });

    const TOTAL_BOOTHS = 3;
    if (overlappingBookings.length >= TOTAL_BOOTHS) {
      return res.status(400).json({
        success: false,
        message: 'Slot has become unavailable during your selection. Please choose another slot.',
      });
    }

    // 4. Calculate final pricing
    const priceBreakdown = await computePricing(packageId, addOnIds);

    // 5. Initialize pending booking in database
    const booking = new Booking({
      user: user._id,
      eventDetails: {
        date: new Date(date),
        startTime,
        endTime,
        eventType,
        venueAddress,
      },
      selectedPackage: packageId,
      selectedAddOns: addOnIds.filter(id => mongoose.Types.ObjectId.isValid(id)),
      pricing: {
        baseCost: priceBreakdown.baseCost,
        addOnsTotalCost: priceBreakdown.addOnsTotalCost,
        tax: priceBreakdown.tax,
        grandTotal: priceBreakdown.grandTotal,
      },
      paymentStatus: 'pending',
      bookingStatus: 'pending',
    });

    await booking.save();

    // 6. Stripe Session or Fallback Mock Checkout
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';

    if (stripe) {
      // Build Stripe Line Items
      const lineItems = [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `Anti-Gravity Photo Booth: ${priceBreakdown.boothPackage.name}`,
              description: priceBreakdown.boothPackage.description,
            },
            unit_amount: Math.round(priceBreakdown.baseCost * 100), // Stripe takes amounts in cents
          },
          quantity: 1,
        },
      ];

      // Add selected AddOns
      priceBreakdown.addOnsList.forEach((addOn) => {
        lineItems.push({
          price_data: {
            currency: 'usd',
            product_data: {
              name: `Add-On: ${addOn.name}`,
              description: addOn.description,
            },
            unit_amount: Math.round(addOn.price * 100),
          },
          quantity: 1,
        });
      });

      // Add Tax as a line item
      if (priceBreakdown.tax > 0) {
        lineItems.push({
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Sales Tax (8.25%)',
            },
            unit_amount: Math.round(priceBreakdown.tax * 100),
          },
          quantity: 1,
        });
      }

      // Create actual Stripe Checkout Session
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: lineItems,
        mode: 'payment',
        customer_email: email,
        success_url: `${clientUrl}/booking-success?session_id={CHECKOUT_SESSION_ID}&booking_id=${booking._id}`,
        cancel_url: `${clientUrl}/booking-cancelled?booking_id=${booking._id}`,
        metadata: {
          bookingId: booking._id.toString(),
        },
      });

      // Update booking with Stripe Session ID
      booking.stripeSessionId = session.id;
      await booking.save();

      return res.status(200).json({
        success: true,
        bookingId: booking._id,
        checkoutUrl: session.url,
        isMock: false,
      });
    } else {
      // FALLBACK: Mock Stripe checkout session for local development
      const mockSessionId = 'mock_stripe_session_' + Math.random().toString(36).substring(2, 15);
      booking.stripeSessionId = mockSessionId;
      await booking.save();

      const mockCheckoutUrl = `${clientUrl}/mock-checkout?session_id=${mockSessionId}&booking_id=${booking._id}`;

      return res.status(200).json({
        success: true,
        bookingId: booking._id,
        checkoutUrl: mockCheckoutUrl,
        isMock: true,
        message: 'Stripe keys are not configured. Running in Mock Checkout Mode.',
      });
    }
  } catch (error) {
    console.error('createBookingSession Error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error creating booking session',
    });
  }
};

module.exports = {
  checkAvailability,
  calculateTotalPricing,
  createBookingSession,
};
