const mongoose = require('mongoose');

const addOnSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Add-on name is required'],
      trim: true,
      unique: true,
      maxlength: [100, 'Add-on name cannot exceed 100 characters'],
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative'],
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('AddOn', addOnSchema);
