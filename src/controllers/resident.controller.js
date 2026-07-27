const Resident = require('../models/Resident.model');
const Payment = require('../models/Payment.model');
const Settings = require('../models/Settings.model');
const asyncHandler = require('../middleware/asyncHandler');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');

// @desc    List all residents (most recently created first)
// @route   GET /api/residents
const getResidents = asyncHandler(async (req, res) => {
  const residents = await Resident.find().sort({ createdAt: -1 });
  res.status(200).json(new ApiResponse(200, residents));
});

// @desc    Get a single resident by id
// @route   GET /api/residents/:id
const getResidentById = asyncHandler(async (req, res) => {
  const resident = await Resident.findById(req.params.id);
  if (!resident) throw new ApiError(404, 'Resident not found');
  res.status(200).json(new ApiResponse(200, resident));
});

// @desc    Create a new resident. If created with status 'paid', a matching
//          payment record is created for the current month (mirrors the
//          "add resident already paid" flow from the frontend).
// @route   POST /api/residents
const createResident = asyncHandler(async (req, res) => {
  const { name, flat, phone, status } = req.body;

  if (!name || !flat || !phone) {
    throw new ApiError(400, 'name, flat and phone are required');
  }

  const existing = await Resident.findOne({ flat: flat.trim() });
  if (existing) {
    throw new ApiError(409, `A resident already exists for flat ${flat}`);
  }

  const resident = await Resident.create({
    name: name.trim(),
    flat: flat.trim(),
    phone: phone.trim(),
    status: status && ['paid', 'pending', 'overdue'].includes(status) ? status : 'pending',
  });

  if (resident.status === 'paid') {
    const settings = (await Settings.findOne({ key: 'main' })) || (await Settings.create({}));
    const now = new Date();
    const payment = await Payment.create({
      residentId: resident._id,
      residentName: resident.name,
      flat: resident.flat,
      amount: settings.monthlyAmount,
      date: now,
      method: 'Cash',
      txnId: `CSH-NEW-${resident.flat}-${Date.now().toString().slice(-4)}`,
      month: now.toISOString().substring(0, 7),
    });
    resident.lastPaymentId = payment._id;
    await resident.save();
  }

  res.status(201).json(new ApiResponse(201, resident, 'Resident created successfully'));
});

// @desc    Update a resident's basic details
// @route   PUT /api/residents/:id
const updateResident = asyncHandler(async (req, res) => {
  const { name, flat, phone } = req.body;
  const resident = await Resident.findById(req.params.id);
  if (!resident) throw new ApiError(404, 'Resident not found');

  if (flat && flat.trim() !== resident.flat) {
    const flatTaken = await Resident.findOne({ flat: flat.trim(), _id: { $ne: resident._id } });
    if (flatTaken) throw new ApiError(409, `A resident already exists for flat ${flat}`);
    resident.flat = flat.trim();
  }
  if (name) resident.name = name.trim();
  if (phone) resident.phone = phone.trim();

  await resident.save();
  res.status(200).json(new ApiResponse(200, resident, 'Resident updated successfully'));
});

// @desc    Delete a resident
// @route   DELETE /api/residents/:id
const deleteResident = asyncHandler(async (req, res) => {
  const resident = await Resident.findById(req.params.id);
  if (!resident) throw new ApiError(404, 'Resident not found');
  await resident.deleteOne();
  res.status(200).json(new ApiResponse(200, { id: req.params.id }, 'Resident deleted successfully'));
});

// @desc    Mark a resident as paid for the current month - creates a Payment
//          record and flips the resident's status to 'paid'
// @route   POST /api/residents/:id/mark-paid
const markResidentPaid = asyncHandler(async (req, res) => {
  const { method, txnId } = req.body;
  if (!method || !txnId) {
    throw new ApiError(400, 'method and txnId are required');
  }

  const resident = await Resident.findById(req.params.id);
  if (!resident) throw new ApiError(404, 'Resident not found');

  const settings = (await Settings.findOne({ key: 'main' })) || (await Settings.create({}));
  const now = new Date();

  const payment = await Payment.create({
    residentId: resident._id,
    residentName: resident.name,
    flat: resident.flat,
    amount: settings.monthlyAmount,
    date: now,
    method,
    txnId,
    month: now.toISOString().substring(0, 7),
  });

  resident.status = 'paid';
  resident.lastPaymentId = payment._id;
  await resident.save();

  res
    .status(200)
    .json(new ApiResponse(200, { resident, payment }, 'Resident marked as paid successfully'));
});

module.exports = {
  getResidents,
  getResidentById,
  createResident,
  updateResident,
  deleteResident,
  markResidentPaid,
};
