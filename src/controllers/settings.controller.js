const Settings = require('../models/Settings.model');
const asyncHandler = require('../middleware/asyncHandler');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const { resetDatabase } = require('../utils/seedData');

// @desc    Get the (singleton) society settings document, creating defaults if absent
// @route   GET /api/settings
const getSettings = asyncHandler(async (req, res) => {
  let settings = await Settings.findOne({ key: 'main' });
  if (!settings) {
    settings = await Settings.create({ key: 'main' });
  }
  res.status(200).json(new ApiResponse(200, settings));
});

// @desc    Update society settings (name, monthly amount, UPI id, reminder template)
// @route   PUT /api/settings
const updateSettings = asyncHandler(async (req, res) => {
  const { societyName, monthlyAmount, upiId, reminderTemplate } = req.body;

  if (societyName !== undefined && !societyName.trim()) {
    throw new ApiError(400, 'societyName cannot be empty');
  }
  if (monthlyAmount !== undefined && Number(monthlyAmount) <= 0) {
    throw new ApiError(400, 'monthlyAmount must be greater than 0');
  }
  if (upiId !== undefined && !upiId.trim()) {
    throw new ApiError(400, 'upiId cannot be empty');
  }

  let settings = await Settings.findOne({ key: 'main' });
  if (!settings) {
    settings = new Settings({ key: 'main' });
  }

  if (societyName !== undefined) settings.societyName = societyName.trim();
  if (monthlyAmount !== undefined) settings.monthlyAmount = Number(monthlyAmount);
  if (upiId !== undefined) settings.upiId = upiId.trim();
  if (reminderTemplate !== undefined) settings.reminderTemplate = reminderTemplate;

  await settings.save();

  res.status(200).json(new ApiResponse(200, settings, 'Settings updated successfully'));
});

// @desc    Reset the entire database (settings, residents, payments) back to demo data
// @route   POST /api/settings/reset
const resetSystem = asyncHandler(async (req, res) => {
  const result = await resetDatabase();
  res
    .status(200)
    .json(new ApiResponse(200, result.settings, 'System database restored to demo default'));
});

module.exports = { getSettings, updateSettings, resetSystem };
