const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
    },
    eventDetails: {
      date: {
        type: Date,
        required: [true, 'Event date is required'],
        index: true, // Performance indexing for availability checks
      },
      startTime: {
        type: String,
        required: [true, 'Start time is required'],
        match: [
          /^([0-9]|0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/,
          'Start time must be in HH:MM format',
        ],
      },
      endTime: {
        type: String,
        required: [true, 'End time is required'],
        match: [
          /^([0-9]|0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/,
          'End time must be in HH:MM format',
        ],
      },
      eventType: {
        type: String,
        required: [true, 'Event type is required'],
        trim: true,
      },
      venueAddress: {
        type: String,
        required: [true, 'Venue address is required'],
        trim: true,
      },
    },
    selectedPackage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'BoothPackage',
      required: [true, 'Selected package is required'],
    },
    selectedAddOns: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'AddOn',
      },
    ],
    pricing: {
      baseCost: {
        type: Number,
        required: true,
        min: 0,
      },
      addOnsTotalCost: {
        type: Number,
        required: true,
        min: 0,
        default: 0,
      },
      tax: {
        type: Number,
        required: true,
        min: 0,
        default: 0,
      },
      grandTotal: {
        type: Number,
        required: true,
        min: 0,
      },
    },
    paymentStatus: {
      type: String,
      enum: {
        values: ['pending', 'paid', 'failed'],
        message: 'Payment status must be pending, paid, or failed',
      },
      default: 'pending',
    },
    bookingStatus: {
      type: String,
      enum: {
        values: ['pending', 'confirmed', 'cancelled', 'completed'],
        message: 'Booking status must be pending, confirmed, cancelled, or completed',
      },
      default: 'pending',
    },
    stripeSessionId: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Compounding indexes or validation can be added if needed
module.exports = mongoose.model('Booking', bookingSchema);
