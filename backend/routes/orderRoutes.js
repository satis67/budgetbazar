const express = require('express'); const router = express.Router(); const { createOrder, getMyOrders, getOrderById, cancelOrder, returnOrder } = require('../controllers/orderController'); const { protect } = require('../middleware/authMiddleware');
router.route('/').post(protect, createOrder);
router.route('/myorders').get(protect, getMyOrders);
router.route('/:id').get(protect, getOrderById);
router.route('/:id/cancel').put(protect, cancelOrder);
router.route('/:id/return').put(protect, returnOrder);
module.exports = router;
