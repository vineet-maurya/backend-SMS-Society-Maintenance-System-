const mongoose = require('mongoose');

const residentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Resident name is required'],
      trim: true,
    },
    flat: {
      type: String,
      required: [true, 'Flat number is required'],
      trim: true,
      unique: true,
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
      match: [/^\d{10}$/, 'Phone number must be a 10 digit number'],
    },
    status: {
      type: String,
      enum: ['paid', 'pending', 'overdue'],
      default: 'pending',
    },
    lastPaymentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Payment',
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Resident', residentSchema);
