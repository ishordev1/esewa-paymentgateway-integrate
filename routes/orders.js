const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { isAuthenticated, isAdmin } = require('../middleware/auth');

// All routes require admin authentication
router.use(isAuthenticated);
router.use(isAdmin);

// Order routes
router.get('/', orderController.getAllOrders);
router.get('/:id', orderController.getOrderDetails);
router.post('/:id/status', orderController.updateOrderStatus);

module.exports = router;
