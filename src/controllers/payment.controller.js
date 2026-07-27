const Payment = require('../models/Payment.model');
const asyncHandler = require('../middleware/asyncHandler');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');

// @desc    List all payments, optionally filtered by ?month=YYYY-MM
// @route   GET /api/payments
const getPayments = asyncHandler(async (req, res) => {
  const { month } = req.query;
  const filter = {};
  if (month) filter.month = month;

  const payments = await Payment.find(filter).sort({ date: -1 });
  res.status(200).json(new ApiResponse(200, payments));
});

// @desc    Get a single payment by id
// @route   GET /api/payments/:id
const getPaymentById = asyncHandler(async (req, res) => {
  const payment = await Payment.findById(req.params.id);
  if (!payment) throw new ApiError(404, 'Payment not found');
  res.status(200).json(new ApiResponse(200, payment));
});

// @desc    Manually record a payment not tied to the mark-paid resident flow
// @route   POST /api/payments
const createPayment = asyncHandler(async (req, res) => {
  const { residentId, residentName, flat, amount, method, txnId, month, date } = req.body;

  if (!residentId || !residentName || !flat || !amount || !txnId || !month) {
    throw new ApiError(
      400,
      'residentId, residentName, flat, amount, txnId and month are required'
    );
  }

  const payment = await Payment.create({
    residentId,
    residentName,
    flat,
    amount,
    method: method || 'UPI',
    txnId,
    month,
    date: date ? new Date(date) : new Date(),
  });

  res.status(201).json(new ApiResponse(201, payment, 'Payment recorded successfully'));
});

// @desc    Delete a payment record (admin correction)
// @route   DELETE /api/payments/:id
const deletePayment = asyncHandler(async (req, res) => {
  const payment = await Payment.findById(req.params.id);
  if (!payment) throw new ApiError(404, 'Payment not found');
  await payment.deleteOne();
  res.status(200).json(new ApiResponse(200, { id: req.params.id }, 'Payment deleted successfully'));
});

module.exports = { getPayments, getPaymentById, createPayment, deletePayment };
