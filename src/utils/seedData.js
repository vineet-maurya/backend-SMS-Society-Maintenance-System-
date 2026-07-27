/**
 * Seeds (or resets) the database with the same demo dataset the frontend
 * previously kept in localStorage. Can be run standalone via `npm run seed`
 * or invoked programmatically by the settings "reset database" endpoint.
 */
require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const Resident = require('../models/Resident.model');
const Payment = require('../models/Payment.model');
const Settings = require('../models/Settings.model');

const DEFAULT_SETTINGS = {
  key: 'main',
  societyName: 'Green Glen Heights',
  monthlyAmount: 2000,
  upiId: 'greenglen@upi',
  reminderTemplate:
    'Hi {name} (Flat {flat}), this is a friendly reminder to pay the monthly maintenance of ₹{amount} for {society}. Please transfer via UPI to our UPI ID: {upi}. Thank you!',
  currentMonth: new Date().toISOString().substring(0, 7),
};

const DEFAULT_RESIDENTS = [
  { name: 'Aarav Sharma', flat: '101', phone: '9876543210', status: 'paid' },
  { name: 'Priya Patel', flat: '102', phone: '9876543211', status: 'pending' },
  { name: 'Rohan Verma', flat: '201', phone: '9876543212', status: 'overdue' },
  { name: 'Vikram Singh', flat: '202', phone: '9876543213', status: 'paid' },
  { name: 'Sneha Reddy', flat: '301', phone: '9876543214', status: 'pending' },
  { name: 'Ananya Iyer', flat: '302', phone: '9876543215', status: 'paid' },
];

/**
 * Wipes and reseeds the residents/payments/settings collections with
 * demo data. Exported so the /api/settings/reset endpoint can reuse it.
 */
const resetDatabase = async () => {
  await Promise.all([Resident.deleteMany({}), Payment.deleteMany({}), Settings.deleteMany({})]);

  const settings = await Settings.create(DEFAULT_SETTINGS);

  const currentMonth = settings.currentMonth;
  const [prevYear, prevMonthNum] = currentMonth.split('-').map(Number);
  const prevDate = new Date(prevYear, prevMonthNum - 2, 1); // previous month
  const prevMonthStr = prevDate.toISOString().substring(0, 7);

  const createdResidents = [];
  for (const r of DEFAULT_RESIDENTS) {
    const resident = await Resident.create(r);
    createdResidents.push(resident);
  }

  const findRes = (flat) => createdResidents.find((r) => r.flat === flat);

  // Previous month payments for all residents (full collection last month)
  const prevMonthPayments = [
    { flat: '101', method: 'UPI', txnId: 'UPI65432109876' },
    { flat: '102', method: 'Cash', txnId: 'CSH-102-0626' },
    { flat: '201', method: 'UPI', txnId: 'UPI55667788990' },
    { flat: '202', method: 'UPI', txnId: 'UPI88990011223' },
    { flat: '301', method: 'Cash', txnId: 'CSH-301-0626' },
    { flat: '302', method: 'UPI', txnId: 'UPI00112233445' },
  ];
  for (const p of prevMonthPayments) {
    const resident = findRes(p.flat);
    await Payment.create({
      residentId: resident._id,
      residentName: resident.name,
      flat: resident.flat,
      amount: settings.monthlyAmount,
      date: new Date(`${prevMonthStr}-05T10:00:00.000Z`),
      method: p.method,
      txnId: p.txnId,
      month: prevMonthStr,
    });
  }

  // Current month payments only for residents already marked 'paid'
  const currentMonthPaymentsMap = {
    '101': { method: 'UPI', txnId: 'UPI98765432101' },
    '202': { method: 'Cash', txnId: 'CSH-202-0726' },
    '302': { method: 'UPI', txnId: 'UPI11223344556' },
  };
  for (const [flat, p] of Object.entries(currentMonthPaymentsMap)) {
    const resident = findRes(flat);
    const payment = await Payment.create({
      residentId: resident._id,
      residentName: resident.name,
      flat: resident.flat,
      amount: settings.monthlyAmount,
      date: new Date(),
      method: p.method,
      txnId: p.txnId,
      month: currentMonth,
    });
    resident.lastPaymentId = payment._id;
    await resident.save();
  }

  return { settings, residentsCount: createdResidents.length };
};

// Allow running directly: `npm run seed`
if (require.main === module) {
  (async () => {
    await connectDB();
    const result = await resetDatabase();
    console.log(`[Seed] Database reset complete. ${result.residentsCount} residents created.`);
    await mongoose.disconnect();
    process.exit(0);
  })().catch((err) => {
    console.error('[Seed] Failed:', err);
    process.exit(1);
  });
}

module.exports = { resetDatabase, DEFAULT_SETTINGS, DEFAULT_RESIDENTS };
