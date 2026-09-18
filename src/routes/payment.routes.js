const express = require('express');
const router = express.Router();
const {
  getPayments,
  getPaymentById,
  createPayment,
  deletePayment,
} = require('../controllers/payment.controller');
const { protect, restrictTo } = require('../middleware/auth.middleware');

// The Payments Ledger (all read/write access to payment records) is
// admin-only functionality. A logged-in normal user gets 403 Forbidden
// here even if they call the API directly (Postman, browser, etc.).
router.use(protect, restrictTo('admin'));

router.route('/').get(getPayments).post(createPayment);
router.route('/:id').get(getPaymentById).delete(deletePayment);

module.exports = router;