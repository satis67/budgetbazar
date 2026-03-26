const express = require('express'); const router = express.Router(); const { getUserCart, addToCart, updateCartQuantity, removeFromCart } = require('../controllers/cartController'); const { protect } = require('../middleware/authMiddleware');
router.route('/').get(protect, getUserCart).post(protect, addToCart).put(protect, updateCartQuantity);
router.route('/:productId').delete(protect, removeFromCart);
module.exports = router;
