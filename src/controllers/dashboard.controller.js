const Resident = require('../models/Resident.model');
const Payment = require('../models/Payment.model');
const Settings = require('../models/Settings.model');
const asyncHandler = require('../middleware/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');

// @desc    Aggregated stats for the dashboard overview page
// @route   GET /api/dashboard/stats
const getDashboardStats = asyncHandler(async (req, res) => {
  const currentMonthStr = new Date().toISOString().substring(0, 7);

  const settings = (await Settings.findOne({ key: 'main' })) || (await Settings.create({}));
  const residents = await Resident.find();
  const currentMonthPayments = await Payment.find({ month: currentMonthStr });

  const totalResidentsCount = residents.length;
  const paidCount = residents.filter((r) => r.status === 'paid').length;
  const pendingCount = residents.filter((r) => r.status === 'pending').length;
  const overdueCount = residents.filter((r) => r.status === 'overdue').length;

  const totalCollected = currentMonthPayments.reduce((sum, p) => sum + p.amount, 0);
  const targetCollection = totalResidentsCount * settings.monthlyAmount;
  const collectionPercentage =
    targetCollection > 0 ? Math.round((totalCollected / targetCollection) * 100) : 0;

  const upiCollected = currentMonthPayments
    .filter((p) => p.method === 'UPI')
    .reduce((sum, p) => sum + p.amount, 0);
  const cashCollected = currentMonthPayments
    .filter((p) => p.method === 'Cash')
    .reduce((sum, p) => sum + p.amount, 0);
  const otherCollected = totalCollected - upiCollected - cashCollected;

  const recentPayments = await Payment.find().sort({ date: -1 }).limit(4);

  res.status(200).json(
    new ApiResponse(200, {
      month: currentMonthStr,
      totalResidentsCount,
      paidCount,
      pendingCount,
      overdueCount,
      totalCollected,
      targetCollection,
      collectionPercentage,
      upiCollected,
      cashCollected,
      otherCollected,
      recentPayments,
    })
  );
});

module.exports = { getDashboardStats };
