const express = require('express');
const router = express.Router();
const { getSettings, updateSettings, resetSystem } = require('../controllers/settings.controller');
const { protect, restrictTo } = require('../middleware/auth.middleware');

// Reading settings (society name, monthly amount, etc.) is needed by every
// logged-in user — it powers the sidebar footer on every page, not just the
// Settings screen — so it stays available to both roles, just behind login.
// Changing settings/admin configuration is admin-only functionality.
router.route('/').get(protect, getSettings).put(protect, restrictTo('admin'), updateSettings);
router.route('/reset').post(protect, restrictTo('admin'), resetSystem);

module.exports = router;