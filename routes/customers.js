const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customerController');
const { isAuthenticated, isAdmin } = require('../middleware/auth');

// All routes require admin authentication
router.use(isAuthenticated);
router.use(isAdmin);

// Customer routes
router.get('/', customerController.getAllCustomers);
router.get('/:id', customerController.getCustomerDetails);
router.post('/delete/:id', customerController.deleteCustomer);

module.exports = router;
