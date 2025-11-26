const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { isAuthenticated } = require('../middleware/auth');

router.post('/initiate', isAuthenticated, paymentController.initiatePayment);
router.get('/success', paymentController.paymentSuccess);
router.get('/failure', paymentController.paymentFailure);

module.exports = router;
