const express = require('express');
const router = express.Router();
const { signup, login, getMe } = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth.middleware');

router.post('/signup', signup);
router.post('/login', login);
router.get('/me', protect, getMe);

// module.exports = router;


router.use('/auth', require('./auth.routes'));
router.use('/residents', require('./resident.routes'));
router.use('/payments', require('./payment.routes'));
router.use('/settings', require('./settings.routes'));
router.use('/dashboard', require('./dashboard.routes'));
router.use('/export', require('./export.routes'));

router.get('/health', (req, res) => {
  res.status(200).json({ success: true, message: 'API is healthy', time: new Date().toISOString() });
});

module.exports = router;