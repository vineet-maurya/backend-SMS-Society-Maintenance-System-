const express = require('express');
const router = express.Router();
const {
  getResidents,
  getResidentById,
  createResident,
  updateResident,
  deleteResident,
  markResidentPaid,
  bulkImportResidents,
} = require('../controllers/resident.controller');
const { protect } = require('../middleware/auth.middleware');

// The Residents Directory is available to every logged-in user regardless
// of role, so this only needs `protect` (auth required) — no restrictTo.
router.use(protect);

router.route('/').get(getResidents).post(createResident);
router.route('/bulk-import').post(bulkImportResidents);
router.route('/:id').get(getResidentById).put(updateResident).delete(deleteResident);
router.route('/:id/mark-paid').post(markResidentPaid);

module.exports = router;