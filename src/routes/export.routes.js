const express = require('express');
const router = express.Router();
const { exportResidents, exportPayments } = require('../controllers/export.controller');
const { protect, restrictTo } = require('../middleware/auth.middleware');

// Residents export mirrors the Residents Directory's own access level
// (any logged-in user). Payments export is Payment Ledger data, so it's
// admin-only like the rest of the payments routes.
router.route('/residents').get(protect, exportResidents);
router.route('/payments').get(protect, restrictTo('admin'), exportPayments);

module.exports = router;