const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema(
  {
    // Singleton key - always 'main' so there's only ever one settings document
    key: {
      type: String,
      default: 'main',
      unique: true,
    },
    societyName: {
      type: String,
      required: true,
      default: 'Green Glen Heights',
      trim: true,
    },
    monthlyAmount: {
      type: Number,
      required: true,
      default: 2000,
      min: [1, 'Monthly amount must be greater than 0'],
    },
    upiId: {
      type: String,
      required: true,
      default: 'greenglen@upi',
      trim: true,
    },
    reminderTemplate: {
      type: String,
      default:
        'Hi {name} (Flat {flat}), this is a friendly reminder to pay the monthly maintenance of ₹{amount} for {society}. Please transfer via UPI to our UPI ID: {upi}. Thank you!',
    },
    // Tracks the last month (YYYY-MM) the monthly rollover job ran for
    currentMonth: {
      type: String,
      default: () => new Date().toISOString().substring(0, 7),
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Settings', settingsSchema);
