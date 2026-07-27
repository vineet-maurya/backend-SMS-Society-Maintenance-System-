const express = require('express');
const router = express.Router();
const { getSettings, updateSettings, resetSystem } = require('../controllers/settings.controller');

router.route('/').get(getSettings).put(updateSettings);
router.route('/reset').post(resetSystem);

module.exports = router;
