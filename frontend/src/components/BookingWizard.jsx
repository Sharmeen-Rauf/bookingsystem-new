import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Sparkles, 
  ArrowRight, 
  ArrowLeft, 
  Check, 
  CreditCard, 
  User, 
  Mail, 
  Phone, 
  ShieldCheck, 
  Loader2, 
  Info,
  PartyPopper,
  AlertCircle
} from 'lucide-react';
import confetti from 'canvas-confetti';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/bookings';

// Fallback mock data in case backend is offline
const MOCK_PACKAGES = [
  {
    _id: 'pkg_std_mock',
    name: 'Anti-Gravity Standard',
    description: 'Perfect for smaller events. Includes our standard floating platform, neon light rig, and digital sharing options.',
    basePrice: 250,
    durationInHours: 2,
    features: [
      '2 Hours Operational Time',
      'Anti-Gravity Floating Camera Rig',
      'Neon Space Backdrop',
      'Digital Overlay Design',
      'Live Guest Digital Delivery (SMS/Email)',
      '1 Professional Attendant'
    ]
  },
  {
    _id: 'pkg_prem_mock',
    name: 'Anti-Gravity Premium',
    description: 'Our top-tier package featuring 360-degree floating rigs, slow-motion rendering, and physical props to wow your guests.',
    basePrice: 450,
    durationInHours: 4,
    features: [
      '4 Hours Operational Time',
      '360-Degree Floating Camera Rig',
      'Green Screen & 3D Virtual Backdrops',
      'Interactive Digital Sharing Kiosk',
      'Custom Photo/Video Overlay Branding',
      'Physical Weightless Props Kit',
      'Slow-Motion Video Renderings',
      '2 Professional Attendants'
    ]
  }
];

const MOCK_ADDONS = [
  {
    _id: 'add_backdrop_mock',
    name: 'Custom Space Backdrop',
    price: 100,
    description: 'A custom-tailored physical or green-screen galactic backdrop specific to your event theme.'
  },
  {
    _id: 'add_kiosk_mock',
    name: 'Digital Sharing Kiosk',
    price: 150,
    description: 'An independent secondary terminal for guests to view, print, and share their media.'
  },
  {
    _id: 'add_greenscreen_mock',
    name: 'Green Screen Effect Upgrade',
    price: 80,
    description: 'Unlocks custom dynamic 3D space environments for gravity-defying overlay photos.'
  },
  {
    _id: 'add_props_mock',
    name: 'Weightless Props Kit',
    price: 50,
    description: 'Additional selection of fun astronaut helmets, alien masks, and space-themed props.'
  },
  {
    _id: 'add_slomo_mock',
    name: 'Slow-Motion Video Upgrade',
    price: 120,
    description: 'Enables ultra-smooth high-frame-rate rendering for cinematic action shots.'
  }
];

export default function BookingWizard() {
  // Navigation & Step State
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successInfo, setSuccessInfo] = useState(null);

  // Products from Database
  const [packages, setPackages] = useState(MOCK_PACKAGES);
  const [addOns, setAddOns] = useState(MOCK_ADDONS);

  // User input states
  const [eventDetails, setEventDetails] = useState({
    date: '',
    startTime: '18:00',
    endTime: '20:00',
    eventType: 'Wedding',
    venueAddress: ''
  });

  const [customerDetails, setCustomerDetails] = useState({
    name: '',
    email: '',
    phone: ''
  });

  const [selectedPackageId, setSelectedPackageId] = useState('');
  const [selectedAddOnIds, setSelectedAddOnIds] = useState([]);

  // Availability State
  const [availabilityChecked, setAvailabilityChecked] = useState(false);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [isAvailable, setIsAvailable] = useState(false);
  const [availabilityMessage, setAvailabilityMessage] = useState('');

  // Live Pricing Breakdown State
  const [pricing, setPricing] = useState({
    baseCost: 0,
    addOnsTotalCost: 0,
    tax: 0,
    grandTotal: 0
  });
  const [pricingLoading, setPricingLoading] = useState(false);

  // Check URL query parameters for redirect from checkout (Real/Mock Stripe)
  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    const bookingId = query.get('booking_id');
    const sessionId = query.get('session_id');

    if (bookingId) {
      confirmBookingPayment(bookingId, sessionId);
    }
  }, []);

  // Fetch Packages and AddOns from backend on mount
  useEffect(() => {
    fetchProducts();
  }, []);

  // Update pricing breakdown when package or add-ons change
  useEffect(() => {
    if (selectedPackageId) {
      calculateLivePricing();
    }
  }, [selectedPackageId, selectedAddOnIds]);

  const fetchProducts = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/products`);
      const data = await response.json();
      if (data.success) {
        if (data.packages && data.packages.length > 0) setPackages(data.packages);
        if (data.addOns && data.addOns.length > 0) setAddOns(data.addOns);
      }
    } catch (err) {
      console.log('Backend offline, using high-fidelity mock products', err);
    }
  };

  const confirmBookingPayment = async (bookingId, sessionId) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId, sessionId })
      });
      const data = await response.json();
      if (data.success) {
        setSuccessInfo(data.booking);
        setStep(5); // Success step
        
        // Trigger gravity-defying blue/purple confetti
        const end = Date.now() + 3 * 1000;
        const colors = ['#8b5cf6', '#06b6d4', '#ec4899', '#ffffff'];
        
        (function frame() {
          confetti({
            particleCount: 3,
            angle: 60,
            spread: 55,
            origin: { x: 0 },
            colors: colors
          });
          confetti({
            particleCount: 3,
            angle: 120,
            spread: 55,
            origin: { x: 1 },
            colors: colors
          });
          
          if (Date.now() < end) {
            requestAnimationFrame(frame);
          }
        }());
      } else {
        setError(data.message || 'Payment verification failed.');
      }
    } catch (err) {
      setError('Could not verify payment. Please contact support.');
    } finally {
      setLoading(false);
    }
  };

  const checkAvailabilitySlot = async (e) => {
    if (e) e.preventDefault();
    if (!eventDetails.date || !eventDetails.startTime || !eventDetails.endTime) {
      setAvailabilityMessage('Please fill in Date, Start Time, and End Time');
      return;
    }

    setAvailabilityLoading(true);
    setAvailabilityMessage('');
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/availability`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: eventDetails.date,
          startTime: eventDetails.startTime,
          endTime: eventDetails.endTime
        })
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        setIsAvailable(true);
        setAvailabilityMessage(data.message || 'Slot is available for booking!');
        setAvailabilityChecked(true);
      } else {
        setIsAvailable(false);
        setAvailabilityMessage(data.message || 'Slot is fully booked.');
        setAvailabilityChecked(true);
      }
    } catch (err) {
      // Fallback availability check if backend is offline
      console.log('Backend offline, running local availability simulation');
      setTimeout(() => {
        setIsAvailable(true);
        setAvailabilityMessage('Available! (Local Offline Simulation Mode)');
        setAvailabilityChecked(true);
        setAvailabilityLoading(false);
      }, 800);
      return;
    } finally {
      setAvailabilityLoading(false);
    }
  };

  const calculateLivePricing = async () => {
    setPricingLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/price-breakdown`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          packageId: selectedPackageId,
          addOnIds: selectedAddOnIds
        })
      });
      const data = await response.json();
      if (data.success) {
        setPricing(data.pricing);
      }
    } catch (err) {
      // Offline Local Math Fallback
      const pkg = packages.find(p => p._id === selectedPackageId);
      const pkgPrice = pkg ? pkg.basePrice : 0;
      const addonsPrice = addOns
        .filter(a => selectedAddOnIds.includes(a._id))
        .reduce((sum, item) => sum + item.price, 0);
      const subtotal = pkgPrice + addonsPrice;
      const tax = Math.round(subtotal * 0.0825 * 100) / 100;
      const grandTotal = subtotal + tax;

      setPricing({
        baseCost: pkgPrice,
        addOnsTotalCost: addonsPrice,
        tax,
        grandTotal
      });
    } finally {
      setPricingLoading(false);
    }
  };

  const handleCheckout = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerDetails,
          eventDetails,
          packageId: selectedPackageId,
          addOnIds: selectedAddOnIds
        })
      });
      const data = await response.json();

      if (data.success && data.checkoutUrl) {
        if (data.isMock) {
          // If offline mock mode, redirect locally
          window.location.href = data.checkoutUrl;
        } else {
          // Real Stripe Checkout redirect
          window.location.href = data.checkoutUrl;
        }
      } else {
        setError(data.message || 'Failed to create checkout session.');
        setLoading(false);
      }
    } catch (err) {
      // Local development simulation fallback if server is fully offline
      console.log('Booking checkout offline fallback simulation');
      setTimeout(() => {
        const mockBookingId = 'mock_b_' + Math.random().toString(36).substring(2, 9);
        const mockSessionId = 'mock_s_' + Math.random().toString(36).substring(2, 9);
        // Redirect to success route locally
        window.location.search = `?booking_id=${mockBookingId}&session_id=${mockSessionId}`;
      }, 1000);
    }
  };

  const toggleAddOn = (addOnId) => {
    setSelectedAddOnIds(prev => 
      prev.includes(addOnId) 
        ? prev.filter(id => id !== addOnId) 
        : [...prev, addOnId]
    );
  };

  const nextStep = () => {
    if (step === 1) {
      if (!isAvailable) {
        setError('Please check slot availability first and verify it is available.');
        return;
      }
      if (!eventDetails.venueAddress || !customerDetails.name || !customerDetails.email || !customerDetails.phone) {
        setError('Please enter all details and contact info.');
        return;
      }
    }
    if (step === 2 && !selectedPackageId) {
      setError('Please select a photo booth package to continue.');
      return;
    }
    setError(null);
    setStep(prev => prev + 1);
  };

  const prevStep = () => {
    setError(null);
    setStep(prev => prev - 1);
  };

  // Helper values
  const currentPackage = packages.find(p => p._id === selectedPackageId);
  const activeAddOns = addOns.filter(a => selectedAddOnIds.includes(a._id));

  // --- RENDERING SUCCESS STEP ---
  if (step === 5) {
    return (
      <div className="max-w-2xl mx-auto py-10 px-4">
        <div className="glass-panel rounded-3xl p-8 md:p-12 text-center relative overflow-hidden border-2 border-cyan-500/30 shadow-2xl animate-gravity-float">
          {/* Floating glowing orbit blobs */}
          <div className="absolute -top-20 -left-20 w-48 h-48 rounded-full bg-violet-600/20 blur-3xl"></div>
          <div className="absolute -bottom-20 -right-20 w-48 h-48 rounded-full bg-cyan-600/20 blur-3xl"></div>

          <div className="w-24 h-24 bg-gradient-to-tr from-cyan-400 to-violet-500 rounded-full flex items-center justify-center mx-auto mb-8 shadow-lg shadow-cyan-500/20">
            <Check className="w-12 h-12 text-white" />
          </div>

          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-cyan-400 via-violet-300 to-pink-400 bg-clip-text text-transparent mb-4">
            Orbit Established!
          </h1>
          <p className="text-lg text-violet-200/90 mb-8 max-w-md mx-auto">
            Your booking is officially confirmed. Get ready to experience weightless photography at your upcoming event!
          </p>

          <div className="bg-slate-950/50 rounded-2xl border border-white/5 p-6 text-left mb-8 max-w-md mx-auto space-y-4">
            <h2 className="text-sm font-semibold tracking-wide uppercase text-cyan-400 mb-2 border-b border-white/5 pb-2">Booking Summary</h2>
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Attendant Name:</span>
              <span className="text-white font-medium">{customerDetails.name || successInfo?.user?.name || 'Customer'}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Event Date:</span>
              <span className="text-white font-medium">
                {eventDetails.date ? new Date(eventDetails.date).toLocaleDateString(undefined, { dateStyle: 'long' }) : 'Confirmed'}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Timings:</span>
              <span className="text-white font-medium">{eventDetails.startTime} - {eventDetails.endTime}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Package:</span>
              <span className="text-violet-300 font-semibold">{currentPackage?.name || 'Selected Package'}</span>
            </div>
            <div className="flex justify-between text-sm border-t border-white/5 pt-3 mt-3">
              <span className="text-slate-400">Amount Paid:</span>
              <span className="text-cyan-400 font-extrabold text-lg">${pricing.grandTotal || successInfo?.pricing?.grandTotal || '0.00'}</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <button 
              onClick={() => {
                window.location.href = '/';
              }}
              className="px-8 py-3 rounded-xl font-bold bg-gradient-to-r from-cyan-500 to-violet-600 hover:from-cyan-400 hover:to-violet-500 text-white transition-all transform hover:-translate-y-0.5 hover:shadow-lg shadow-cyan-500/25 cursor-pointer"
            >
              Book Another Session
            </button>
            <button 
              onClick={() => window.print()}
              className="px-8 py-3 rounded-xl font-bold border border-white/10 bg-white/5 hover:bg-white/10 text-white transition-all cursor-pointer"
            >
              Print Receipt
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      {/* Wizard Header */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-violet-500/30 bg-violet-950/20 text-xs font-semibold tracking-wider text-violet-300 uppercase mb-4 animate-pulse-slow">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" /> Anti-Gravity Photo Booth Co.
        </div>
        <h1 className="text-4xl md:text-5xl font-black tracking-tight bg-gradient-to-r from-cyan-400 via-white to-violet-400 bg-clip-text text-transparent">
          DEFY PHYSICS
        </h1>
        <p className="text-slate-400 text-sm md:text-base mt-2">
          Interactive weightless booth bookings. Reserve your event launch below.
        </p>
      </div>

      {/* Progress Wizard Header */}
      <div className="mb-10 max-w-2xl mx-auto">
        <div className="flex justify-between items-center relative">
          {/* Background line */}
          <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-0.5 bg-slate-800 -z-10"></div>
          {/* Active progress fill */}
          <div 
            className="absolute left-0 top-1/2 -translate-y-1/2 h-0.5 bg-gradient-to-r from-cyan-400 to-violet-600 -z-10 transition-all duration-500"
            style={{ width: `${((step - 1) / 3) * 100}%` }}
          ></div>

          {[
            { num: 1, name: 'Launch Pad' },
            { num: 2, name: 'Choose Ship' },
            { num: 3, name: 'Boosters' },
            { num: 4, name: 'Orbit Review' }
          ].map((item) => (
            <div key={item.num} className="flex flex-col items-center">
              <div 
                className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs transition-all duration-300 ${
                  step > item.num 
                    ? 'bg-gradient-to-r from-cyan-500 to-violet-600 text-white step-glow'
                    : step === item.num
                      ? 'bg-violet-900 border-2 border-cyan-400 text-white step-glow scale-110'
                      : 'bg-slate-900 border border-slate-700 text-slate-500'
                }`}
              >
                {step > item.num ? <Check className="w-4 h-4" /> : item.num}
              </div>
              <span className={`text-[10px] md:text-xs font-semibold mt-2 ${step >= item.num ? 'text-cyan-400' : 'text-slate-500'}`}>
                {item.name}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Display Errors if any */}
      {error && (
        <div className="mb-6 p-4 rounded-xl border border-red-500/20 bg-red-950/20 text-red-300 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 mt-0.5 text-red-400 shrink-0" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      {/* STEP CONTENT CONTAINER */}
      <div className="glass-panel rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden border border-white/5 min-h-[400px]">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-violet-600/5 rounded-full blur-3xl -z-10"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-cyan-600/5 rounded-full blur-3xl -z-10"></div>

        {/* STEP 1: EVENT INFO */}
        {step === 1 && (
          <div className="space-y-6">
            <h2 className="text-xl md:text-2xl font-bold text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-cyan-400" /> Step 1: Configure Your Launch Pad
            </h2>
            <p className="text-slate-400 text-sm">
              Specify your event details and check scheduling availability. Our team is available in standard slots with 3 parallel booths.
            </p>

            <form onSubmit={checkAvailabilitySlot} className="space-y-6">
              {/* Availability check card */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-950/45 p-4 md:p-5 rounded-2xl border border-white/5">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Event Date</label>
                  <div className="relative">
                    <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-500" />
                    <input 
                      type="date" 
                      value={eventDetails.date}
                      onChange={(e) => {
                        setEventDetails(prev => ({ ...prev, date: e.target.value }));
                        setAvailabilityChecked(false);
                      }}
                      required
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full glass-input rounded-xl py-2.5 pl-11 pr-4 text-sm font-medium focus:ring-1 focus:ring-cyan-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Start Time</label>
                  <div className="relative">
                    <Clock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-500" />
                    <input 
                      type="time" 
                      value={eventDetails.startTime}
                      onChange={(e) => {
                        setEventDetails(prev => ({ ...prev, startTime: e.target.value }));
                        setAvailabilityChecked(false);
                      }}
                      required
                      className="w-full glass-input rounded-xl py-2.5 pl-11 pr-4 text-sm font-medium focus:ring-1 focus:ring-cyan-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">End Time</label>
                  <div className="relative">
                    <Clock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-500" />
                    <input 
                      type="time" 
                      value={eventDetails.endTime}
                      onChange={(e) => {
                        setEventDetails(prev => ({ ...prev, endTime: e.target.value }));
                        setAvailabilityChecked(false);
                      }}
                      required
                      className="w-full glass-input rounded-xl py-2.5 pl-11 pr-4 text-sm font-medium focus:ring-1 focus:ring-cyan-500"
                    />
                  </div>
                </div>

                <div className="md:col-span-3 mt-2 flex flex-col md:flex-row items-center gap-4 justify-between pt-2 border-t border-white/5">
                  <div className="flex items-center gap-2">
                    {availabilityLoading ? (
                      <span className="flex items-center gap-2 text-sm text-cyan-400 font-medium">
                        <Loader2 className="w-4 h-4 animate-spin" /> Verifying availability logs...
                      </span>
                    ) : availabilityChecked ? (
                      <span className={`flex items-center gap-1.5 text-sm font-semibold ${isAvailable ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {isAvailable ? <ShieldCheck className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                        {availabilityMessage}
                      </span>
                    ) : (
                      <span className="text-slate-500 text-xs flex items-center gap-1.5 font-medium">
                        <Info className="w-3.5 h-3.5" /> Check availability before selecting packages.
                      </span>
                    )}
                  </div>
                  <button 
                    type="submit"
                    disabled={availabilityLoading}
                    className="px-6 py-2 rounded-xl text-xs font-extrabold uppercase bg-white/5 border border-white/10 hover:bg-cyan-500 hover:text-black hover:border-cyan-400 transition-all cursor-pointer disabled:opacity-50 shrink-0"
                  >
                    Check Space Slot
                  </button>
                </div>
              </div>

              {/* Event Location & Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Event Type</label>
                  <select
                    value={eventDetails.eventType}
                    onChange={(e) => setEventDetails(prev => ({ ...prev, eventType: e.target.value }))}
                    className="w-full glass-input rounded-xl py-2.5 px-4 text-sm font-medium focus:ring-1 focus:ring-cyan-500"
                  >
                    <option value="Wedding">Wedding</option>
                    <option value="Corporate">Corporate Event</option>
                    <option value="Birthday">Birthday Party</option>
                    <option value="Graduation">Graduation Party</option>
                    <option value="SpaceTheme">Space Theme Launch</option>
                    <option value="Other">Other Event</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Venue Address</label>
                  <div className="relative">
                    <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-500" />
                    <input 
                      type="text" 
                      placeholder="e.g. Galactic Ballroom, Suite 300"
                      value={eventDetails.venueAddress}
                      onChange={(e) => setEventDetails(prev => ({ ...prev, venueAddress: e.target.value }))}
                      required
                      className="w-full glass-input rounded-xl py-2.5 pl-11 pr-4 text-sm font-medium focus:ring-1 focus:ring-cyan-500"
                    />
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="border-t border-white/5 pt-6 space-y-4">
                <h3 className="text-sm font-semibold tracking-wider text-slate-400 uppercase">Attendant Contact Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-2">Attendant Name</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                      <input 
                        type="text" 
                        placeholder="John Doe"
                        value={customerDetails.name}
                        onChange={(e) => setCustomerDetails(prev => ({ ...prev, name: e.target.value }))}
                        required
                        className="w-full glass-input rounded-xl py-2 pl-9 pr-4 text-sm font-medium focus:ring-1 focus:ring-cyan-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-2">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                      <input 
                        type="email" 
                        placeholder="john@example.com"
                        value={customerDetails.email}
                        onChange={(e) => setCustomerDetails(prev => ({ ...prev, email: e.target.value }))}
                        required
                        className="w-full glass-input rounded-xl py-2 pl-9 pr-4 text-sm font-medium focus:ring-1 focus:ring-cyan-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-2">Phone Number</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                      <input 
                        type="tel" 
                        placeholder="+15550199"
                        value={customerDetails.phone}
                        onChange={(e) => setCustomerDetails(prev => ({ ...prev, phone: e.target.value }))}
                        required
                        className="w-full glass-input rounded-xl py-2 pl-9 pr-4 text-sm font-medium focus:ring-1 focus:ring-cyan-500"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </form>
          </div>
        )}

        {/* STEP 2: PACKAGE CARDS */}
        {step === 2 && (
          <div className="space-y-6">
            <h2 className="text-xl md:text-2xl font-bold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-cyan-400" /> Step 2: Choose Your Space Cruiser
            </h2>
            <p className="text-slate-400 text-sm">
              Select one of our core anti-gravity photo booth packages. You can customize details and add booster services in the next steps.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              {packages.map((pkg) => (
                <div 
                  key={pkg._id}
                  onClick={() => setSelectedPackageId(pkg._id)}
                  className={`glass-card rounded-2xl p-6 relative flex flex-col justify-between border cursor-pointer select-none transition-all duration-300 ${
                    selectedPackageId === pkg._id 
                      ? 'border-violet-500 ring-2 ring-violet-500/20 bg-violet-950/10 scale-[1.01]' 
                      : 'border-white/5'
                  }`}
                >
                  {selectedPackageId === pkg._id && (
                    <div className="absolute top-4 right-4 w-6 h-6 bg-violet-500 rounded-full flex items-center justify-center text-white ring-4 ring-violet-500/25">
                      <Check className="w-3.5 h-3.5" />
                    </div>
                  )}

                  <div>
                    <h3 className="text-lg md:text-xl font-extrabold text-white mb-2">{pkg.name}</h3>
                    <p className="text-slate-400 text-xs md:text-sm mb-4 leading-relaxed">{pkg.description}</p>
                    
                    <div className="flex items-baseline gap-1 mb-6 border-b border-white/5 pb-4">
                      <span className="text-3xl font-black text-white">${pkg.basePrice}</span>
                      <span className="text-slate-400 text-xs font-semibold">/ hour ({pkg.durationInHours}h min)</span>
                    </div>

                    <ul className="space-y-2.5 text-xs text-violet-100/80 mb-6">
                      {pkg.features.map((feat, i) => (
                        <li key={i} className="flex items-center gap-2">
                          <Check className="w-4 h-4 text-cyan-400 shrink-0" />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedPackageId(pkg._id);
                    }}
                    className={`w-full py-2.5 rounded-xl text-xs font-extrabold tracking-wider uppercase transition-all duration-200 cursor-pointer ${
                      selectedPackageId === pkg._id 
                        ? 'bg-gradient-to-r from-cyan-500 to-violet-600 text-white' 
                        : 'bg-white/5 hover:bg-white/10 text-white border border-white/10'
                    }`}
                  >
                    {selectedPackageId === pkg._id ? 'Package Selected' : 'Select Package'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STEP 3: ADDONS MARKETPLACE */}
        {step === 3 && (
          <div className="space-y-6">
            <h2 className="text-xl md:text-2xl font-bold text-white flex items-center gap-2">
              <PartyPopper className="w-5 h-5 text-cyan-400" /> Step 3: Add-Ons Marketplace
            </h2>
            <p className="text-slate-400 text-sm">
              Supercharge your booking with our curated selection of special anti-gravity features and props.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[350px] overflow-y-auto pr-2">
              {addOns.map((addon) => (
                <div 
                  key={addon._id}
                  onClick={() => toggleAddOn(addon._id)}
                  className={`p-4 rounded-xl border flex items-start gap-3 cursor-pointer select-none transition-all duration-200 ${
                    selectedAddOnIds.includes(addon._id) 
                      ? 'border-cyan-500/50 bg-cyan-950/10' 
                      : 'border-white/5 bg-slate-900/10 hover:bg-slate-900/25'
                  }`}
                >
                  <div className={`w-5 h-5 rounded flex items-center justify-center border transition-all mt-0.5 ${
                    selectedAddOnIds.includes(addon._id)
                      ? 'bg-cyan-500 border-cyan-400 text-black'
                      : 'border-slate-600'
                  }`}>
                    {selectedAddOnIds.includes(addon._id) && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>

                  <div className="flex-1">
                    <div className="flex justify-between items-baseline gap-2 mb-1">
                      <h4 className="text-sm font-bold text-white">{addon.name}</h4>
                      <span className="text-cyan-400 font-extrabold text-sm shrink-0">+${addon.price}</span>
                    </div>
                    <p className="text-slate-400 text-xs leading-relaxed">{addon.description}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Subtotal feedback bar */}
            <div className="bg-slate-950/45 p-4 rounded-xl border border-white/5 flex justify-between items-center text-sm">
              <span className="text-slate-400 font-medium">
                Add-ons Selected: <strong className="text-cyan-300">{selectedAddOnIds.length}</strong>
              </span>
              <span className="font-extrabold text-cyan-400">
                Add-ons Cost: ${pricing.addOnsTotalCost}
              </span>
            </div>
          </div>
        )}

        {/* STEP 4: REVIEW & CHECKOUT */}
        {step === 4 && (
          <div className="space-y-6">
            <h2 className="text-xl md:text-2xl font-bold text-white flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-cyan-400" /> Step 4: Final Orbit Review
            </h2>
            <p className="text-slate-400 text-sm">
              Verify all coordinates and prices before launching. Checkout is processed safely via Stripe.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Left Column: Summary */}
              <div className="md:col-span-2 space-y-4">
                {/* Event Summary Box */}
                <div className="bg-slate-950/45 p-5 rounded-2xl border border-white/5 space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-400 pb-2 border-b border-white/5 flex items-center justify-between">
                    <span>Flight Details</span>
                    <span className="text-[10px] bg-cyan-950 text-cyan-300 px-2 py-0.5 rounded-full border border-cyan-500/20">{eventDetails.eventType}</span>
                  </h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="text-slate-500 block mb-1">Launch Date & Timings</span>
                      <strong className="text-white">
                        {eventDetails.date} ({eventDetails.startTime} - {eventDetails.endTime})
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block mb-1">Venue Address</span>
                      <strong className="text-white truncate block">{eventDetails.venueAddress}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block mb-1">Lead Attendant</span>
                      <strong className="text-white">{customerDetails.name}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block mb-1">Contact Email</span>
                      <strong className="text-white">{customerDetails.email}</strong>
                    </div>
                  </div>
                </div>

                {/* Package & Addons summary */}
                <div className="bg-slate-950/45 p-5 rounded-2xl border border-white/5 space-y-4">
                  <div>
                    <span className="text-slate-500 text-xs block mb-1">Core Ship Package</span>
                    <div className="flex justify-between items-center bg-violet-950/10 p-3 rounded-xl border border-violet-950/30">
                      <div>
                        <strong className="text-violet-300 text-sm">{currentPackage?.name}</strong>
                        <p className="text-slate-400 text-[10px]">{currentPackage?.description}</p>
                      </div>
                      <span className="font-extrabold text-white text-sm">${currentPackage?.basePrice}</span>
                    </div>
                  </div>

                  {activeAddOns.length > 0 && (
                    <div>
                      <span className="text-slate-500 text-xs block mb-2">Gravity Boosters (Add-ons)</span>
                      <div className="space-y-2 max-h-[120px] overflow-y-auto pr-1">
                        {activeAddOns.map((addon) => (
                          <div key={addon._id} className="flex justify-between items-center text-xs bg-slate-900/40 p-2 rounded-lg border border-white/5">
                            <span className="text-slate-300 font-medium">{addon.name}</span>
                            <span className="text-slate-400 font-semibold">+${addon.price}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Pricing Engine */}
              <div className="bg-gradient-to-b from-slate-950 to-violet-950/35 p-5 rounded-2xl border border-violet-500/20 flex flex-col justify-between h-full">
                <div className="space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-violet-400 pb-2 border-b border-white/5">
                    Live Total Invoice
                  </h3>
                  
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Package Base:</span>
                      <span className="text-white font-semibold">${pricing.baseCost}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Boosters Total:</span>
                      <span className="text-white font-semibold">${pricing.addOnsTotalCost}</span>
                    </div>
                    <div className="flex justify-between pb-2 border-b border-white/5">
                      <span className="text-slate-400">Sales Tax (8.25%):</span>
                      <span className="text-white font-semibold">${pricing.tax}</span>
                    </div>
                    <div className="flex justify-between pt-2">
                      <span className="text-sm font-bold text-cyan-400">Grand Total:</span>
                      <strong className="text-xl font-black text-cyan-400">${pricing.grandTotal}</strong>
                    </div>
                  </div>
                </div>

                <div className="mt-8 space-y-3">
                  <div className="text-[10px] text-slate-500 leading-normal flex items-start gap-1">
                    <Info className="w-3.5 h-3.5 shrink-0 text-violet-400" />
                    <span>Proceeding creates a pending reservation in our system and opens secure Stripe checkout portal.</span>
                  </div>

                  <button 
                    onClick={handleCheckout}
                    disabled={loading}
                    className="w-full py-3 rounded-xl font-extrabold text-sm bg-gradient-to-r from-cyan-500 to-violet-600 hover:from-cyan-400 hover:to-violet-500 text-white transition-all transform hover:-translate-y-0.5 hover:shadow-lg shadow-cyan-500/25 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" /> Launching checkout...
                      </>
                    ) : (
                      <>
                        Launch Payment <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* WIZARD ACTIONS FOOTER */}
        {step < 4 && (
          <div className="mt-8 pt-6 border-t border-white/5 flex justify-between items-center">
            <button 
              onClick={prevStep}
              disabled={step === 1}
              className="px-5 py-2.5 rounded-xl text-xs font-bold border border-white/10 hover:bg-white/5 transition-all text-white flex items-center gap-1 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>

            <button 
              onClick={nextStep}
              className="px-6 py-2.5 rounded-xl text-xs font-bold bg-white text-slate-950 hover:bg-cyan-400 hover:text-black transition-all flex items-center gap-1 cursor-pointer"
            >
              Continue <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
