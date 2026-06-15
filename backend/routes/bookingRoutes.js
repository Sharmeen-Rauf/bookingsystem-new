const express = require('express');
const router = express.Router();
const {
  checkAvailability,
  calculateTotalPricing,
  createBookingSession,
} = require('../controllers/bookingController');
const Booking = require('../models/Booking');

// Post routes for availability checks, price estimations, and checkouts
router.post('/availability', checkAvailability);
router.post('/price-breakdown', calculateTotalPricing);
router.post('/checkout', createBookingSession);

/**
 * @desc    Confirm booking after successful payment callback (Real or Mock)
 * @route   POST /api/bookings/confirm
 * @access  Public (in production, secure with validation or Stripe Webhook)
 */
router.post('/confirm', async (req, res) => {
  try {
    const { bookingId, sessionId } = req.body;

    if (!bookingId) {
      return res.status(400).json({
        success: false,
        message: 'Booking ID is required for confirmation',
      });
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found',
      });
    }

    // In a production app, verify the Stripe Session here to double check payment success.
    // For this implementation, we will update the status to paid and confirmed.
    booking.paymentStatus = 'paid';
    booking.bookingStatus = 'confirmed';
    if (sessionId) {
      booking.stripeSessionId = sessionId;
    }
    await booking.save();

    return res.status(200).json({
      success: true,
      message: 'Booking successfully paid and confirmed!',
      booking,
    });
  } catch (error) {
    console.error('Confirm Booking Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error confirming booking',
      error: error.message,
    });
  }
});

/**
 * @desc    Get all packages and add-ons for the front-end wizard
 * @route   GET /api/bookings/products
 * @access  Public
 */
router.get('/products', async (req, res) => {
  try {
    const BoothPackage = require('../models/BoothPackage');
    const AddOn = require('../models/AddOn');

    const packages = await BoothPackage.find({});
    const addOns = await AddOn.find({});

    return res.status(200).json({
      success: true,
      packages,
      addOns,
    });
  } catch (error) {
    console.error('Get Products Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error fetching packages/add-ons',
    });
  }
});

module.exports = router;
