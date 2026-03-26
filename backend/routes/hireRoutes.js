const express = require('express'); const router = express.Router(); const { hireCoder, getMyRequests, updateStatus } = require('../controllers/hireController'); const { protect } = require('../middleware/authMiddleware');
router.route('/').post(protect, hireCoder).get(protect, getMyRequests); router.route('/:id/status').put(protect, updateStatus); module.exports = router;
