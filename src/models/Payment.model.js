const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    residentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Resident',
      required: true,
    },
    residentName: {
      type: String,
      required: true,
    },
    flat: {
      type: String,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: [1, 'Amount must be greater than 0'],
    },
    date: {
      type: Date,
      default: Date.now,
    },
    method: {
      type: String,
      enum: ['UPI', 'Cash', 'Bank Transfer', 'Cheque', 'Other'],
      default: 'UPI',
    },
    txnId: {
      type: String,
      required: true,
      trim: true,
    },
    // Period the payment applies to, format YYYY-MM
    month: {
      type: String,
      required: true,
      match: [/^\d{4}-\d{2}$/, 'month must be in YYYY-MM format'],
    },
  },
  { timestamps: true }
);

paymentSchema.index({ month: 1 });
paymentSchema.index({ residentId: 1 });

module.exports = mongoose.model('Payment', paymentSchema);
