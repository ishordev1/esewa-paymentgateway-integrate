const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { isAuthenticated, isAdmin } = require('../middleware/auth');
const upload = require('../config/multer');

// All routes require admin authentication
router.use(isAuthenticated);
router.use(isAdmin);

// Product routes
router.get('/', productController.getAllProducts);
router.get('/add', productController.getAddProduct);
router.post('/add', upload.array('images', 5), productController.createProduct);
router.get('/edit/:id', productController.getEditProduct);
router.post('/edit/:id', upload.array('images', 5), productController.updateProduct);
router.post('/delete/:id', productController.deleteProduct);

module.exports = router;
