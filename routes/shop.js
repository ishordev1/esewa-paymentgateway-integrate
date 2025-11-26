const express = require('express');
const router = express.Router();
const shopController = require('../controllers/shopController');
const { isAuthenticated } = require('../middleware/auth');

router.get('/', shopController.getHomePage);
router.get('/products', shopController.getAllProducts);
router.get('/product/:id', shopController.getProductDetail);
router.get('/cart', shopController.getCart);
router.get('/checkout', isAuthenticated, shopController.getCheckout);
router.get('/track-order', shopController.getTrackOrder);
router.post('/track-order', shopController.postTrackOrder);

module.exports = router;
