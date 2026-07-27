const Resident = require('../models/Resident.model');
const Payment = require('../models/Payment.model');
const Settings = require('../models/Settings.model');
const asyncHandler = require('../middleware/asyncHandler');

// Escapes a CSV field value, wrapping in quotes and doubling any inner quotes
const csvEscape = (val) => `"${String(val).replace(/"/g, '""')}"`;

const buildCsv = (headers, rows) =>
  [headers.join(','), ...rows.map((row) => row.map(csvEscape).join(','))].join('\n');

const sanitizeFilename = (name) => name.toLowerCase().replace(/\s+/g, '_');

// @desc    Export residents directory as CSV
// @route   GET /api/export/residents
const exportResidents = asyncHandler(async (req, res) => {
  const settings = (await Settings.findOne({ key: 'main' })) || { societyName: 'society' };
  const residents = await Resident.find().sort({ flat: 1 });

  const headers = ['Resident ID', 'Name', 'Flat No', 'Mobile No', 'Payment Status'];
  const rows = residents.map((r) => [r._id, r.name, r.flat, r.phone, r.status]);
  const csv = buildCsv(headers, rows);

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="${sanitizeFilename(settings.societyName)}_residents.csv"`
  );
  res.status(200).send(csv);
});

// @desc    Export payments ledger as CSV
// @route   GET /api/export/payments
const exportPayments = asyncHandler(async (req, res) => {
  const settings = (await Settings.findOne({ key: 'main' })) || { societyName: 'society' };
  const payments = await Payment.find().sort({ date: -1 });

  const headers = [
    'Payment ID',
    'Resident Name',
    'Flat No',
    'Amount (INR)',
    'Payment Date',
    'Method',
    'Transaction ID',
    'Period Month',
  ];
  const rows = payments.map((p) => [
    p._id,
    p.residentName,
    p.flat,
    p.amount,
    new Date(p.date).toLocaleString('en-IN'),
    p.method,
    p.txnId,
    p.month,
  ]);
  const csv = buildCsv(headers, rows);

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="${sanitizeFilename(settings.societyName)}_payments.csv"`
  );
  res.status(200).send(csv);
});

module.exports = { exportResidents, exportPayments };
