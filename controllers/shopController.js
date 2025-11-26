const Product = require('../models/Product');
const Order = require('../models/Order');
const User = require('../models/User');

// Homepage
exports.getHomePage = async (req, res) => {
    try {
        const featuredProducts = await Product.find({ featured: true, active: true }).limit(6);
        res.render('customer/index', { 
            featuredProducts,
            userName: req.session.userName || null
        });
    } catch (error) {
        console.error('Homepage error:', error);
        res.status(500).send('Error loading page');
    }
};

// All products
exports.getAllProducts = async (req, res) => {
    try {
        const { category } = req.query;
        const filter = { active: true };
        
        if (category) {
            filter.category = category;
        }
        
        const products = await Product.find(filter).sort({ createdAt: -1 });
        res.render('customer/products', { 
            products, 
            selectedCategory: category || null,
            userName: req.session.userName || null
        });
    } catch (error) {
        console.error('Products error:', error);
        res.status(500).send('Error loading products');
    }
};

// Product detail
exports.getProductDetail = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        
        if (!product || !product.active) {
            return res.status(404).send('Product not found');
        }
        
        res.render('customer/product-detail', { 
            product,
            userName: req.session.userName || null
        });
    } catch (error) {
        console.error('Product detail error:', error);
        res.status(500).send('Error loading product');
    }
};

// Cart page
exports.getCart = (req, res) => {
    res.render('customer/cart', {
        userName: req.session.userName || null
    });
};

// Checkout page
exports.getCheckout = async (req, res) => {
    try {
        // User is authenticated (middleware ensures this)
        const user = await User.findById(req.session.userId);
        
        res.render('customer/checkout', {
            userName: req.session.userName || null,
            user: user || null
        });
    } catch (error) {
        console.error('Checkout error:', error);
        res.render('customer/checkout', {
            userName: req.session.userName || null,
            user: null
        });
    }
};

// Track order page
exports.getTrackOrder = (req, res) => {
    res.render('customer/track-order', {
        title: 'Track Order',
        userName: req.session.userName || null,
        order: null,
        orders: null,
        error: null
    });
};

// Track order by order number or email
exports.postTrackOrder = async (req, res) => {
    try {
        const { orderNumber, email } = req.body;
        
        if (!orderNumber && !email) {
            return res.render('customer/track-order', {
                title: 'Track Order',
                userName: req.session.userName || null,
                order: null,
                orders: null,
                error: 'Please provide order number or email address'
            });
        }
        
        // If order number is provided, search for specific order
        if (orderNumber) {
            const order = await Order.findOne({ orderNumber: orderNumber.trim().toUpperCase() })
                .populate('items.product');
            
            if (!order) {
                return res.render('customer/track-order', {
                    title: 'Track Order',
                    userName: req.session.userName || null,
                    order: null,
                    orders: null,
                    error: 'Order not found with the provided order number'
                });
            }
            
            return res.render('customer/track-order', {
                title: 'Track Order',
                userName: req.session.userName || null,
                order: order,
                orders: null,
                error: null
            });
        }
        
        // If email is provided, search for all orders by email
        if (email) {
            const orders = await Order.find({ 'customer.email': email.trim().toLowerCase() })
                .populate('items.product')
                .sort({ createdAt: -1 });
            
            if (orders.length === 0) {
                return res.render('customer/track-order', {
                    title: 'Track Order',
                    userName: req.session.userName || null,
                    order: null,
                    orders: null,
                    error: 'No orders found for this email address'
                });
            }
            
            return res.render('customer/track-order', {
                title: 'Track Order',
                userName: req.session.userName || null,
                orders: orders,
                order: null,
                error: null
            });
        }
        
    } catch (error) {
        console.error('Track order error:', error);
        res.render('customer/track-order', {
            title: 'Track Order',
            userName: req.session.userName || null,
            order: null,
            orders: null,
            error: 'Error tracking order. Please try again.'
        });
    }
};
