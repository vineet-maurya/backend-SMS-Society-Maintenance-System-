const express = require('express');
const router = express.Router();
const { getDashboardStats } = require('../controllers/dashboard.controller');

router.route('/stats').get(getDashboardStats);

module.exports = router;
