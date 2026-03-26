const express = require('express'); const router = express.Router(); const { addAddress, deleteAddress } = require('../controllers/userController'); const { protect } = require('../middleware/authMiddleware');
router.post('/address', protect, addAddress);
router.delete('/address/:addressId', protect, deleteAddress);
module.exports = router;
