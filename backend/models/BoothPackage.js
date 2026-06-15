const mongoose = require('mongoose');

const boothPackageSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Package name is required'],
      trim: true,
      unique: true,
      maxlength: [100, 'Package name cannot exceed 100 characters'],
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
    },
    basePrice: {
      type: Number,
      required: [true, 'Base price is required'],
      min: [0, 'Base price cannot be negative'],
    },
    durationInHours: {
      type: Number,
      required: [true, 'Duration in hours is required'],
      min: [1, 'Duration must be at least 1 hour'],
    },
    features: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('BoothPackage', boothPackageSchema);
