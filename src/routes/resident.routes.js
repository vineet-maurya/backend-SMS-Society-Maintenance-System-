const express = require('express');
const router = express.Router();
const {
  getResidents,
  getResidentById,
  createResident,
  updateResident,
  deleteResident,
  markResidentPaid,
} = require('../controllers/resident.controller');

router.route('/').get(getResidents).post(createResident);
router.route('/:id').get(getResidentById).put(updateResident).delete(deleteResident);
router.route('/:id/mark-paid').post(markResidentPaid);

module.exports = router;
