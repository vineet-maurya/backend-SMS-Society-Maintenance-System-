const express = require('express');
const router = express.Router();
const { getDashboardStats } = require('../controllers/dashboard.controller');
const { protect, restrictTo } = require('../middleware/auth.middleware');

// Dashboard overview is admin-only functionality.
router.route('/stats').get(protect, restrictTo('admin'), getDashboardStats);

module.exports = router;