const express = require('express');
const router = express.Router();
const { exportResidents, exportPayments } = require('../controllers/export.controller');

router.route('/residents').get(exportResidents);
router.route('/payments').get(exportPayments);

module.exports = router;
