const express = require('express');
const router = express.Router();
const {
  getPayments,
  getPaymentById,
  createPayment,
  deletePayment,
} = require('../controllers/payment.controller');

router.route('/').get(getPayments).post(createPayment);
router.route('/:id').get(getPaymentById).delete(deletePayment);

module.exports = router;
