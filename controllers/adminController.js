const User = require('../models/User');

// Show login page
exports.getLogin = (req, res) => {
    // Redirect to main login page
    res.redirect('/login');
};

// Handle login
exports.postLogin = async (req, res) => {
    // Redirect to main login handler
    res.redirect('/login');
};

// Handle logout
exports.logout = (req, res) => {
    // Redirect to main logout handler
    res.redirect('/logout');
};

// Show dashboard
exports.getDashboard = async (req, res) => {
    try {
        const Product = require('../models/Product');
        const Order = require('../models/Order');
        const Customer = require('../models/Customer');
        
        const totalProducts = await Product.countDocuments();
        const totalOrders = await Order.countDocuments();
        const totalCustomers = await Customer.countDocuments();
        
        const recentOrders = await Order.find()
            .sort({ createdAt: -1 })
            .limit(5)
            .populate('items.product');
        
        const pendingOrders = await Order.countDocuments({ orderStatus: 'Pending' });
        
        const totalRevenue = await Order.aggregate([
            { $match: { paymentStatus: 'Completed' } },
            { $group: { _id: null, total: { $sum: '$totalAmount' } } }
        ]);
        
        res.render('admin/dashboard', {
            user: req.session.userName,
            totalProducts,
            totalOrders,
            totalCustomers,
            pendingOrders,
            totalRevenue: totalRevenue.length > 0 ? totalRevenue[0].total : 0,
            recentOrders
        });
    } catch (error) {
        console.error('Dashboard error:', error);
        res.status(500).send('Error loading dashboard');
    }
};
