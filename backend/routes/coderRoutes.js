const express = require('express'); const router = express.Router(); const { createCoderProfile, getCoders, getCoderById } = require('../controllers/coderController'); const { protect } = require('../middleware/authMiddleware');
router.route('/').get(getCoders).post(protect, createCoderProfile); router.route('/:id').get(getCoderById); module.exports = router;
