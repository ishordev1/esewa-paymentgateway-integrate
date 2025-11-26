const Customer = require('../models/Customer');
const Order = require('../models/Order');

// Get all customers
exports.getAllCustomers = async (req, res) => {
    try {
        const customers = await Customer.find().sort({ createdAt: -1 });
        res.render('admin/customers', { 
            user: req.session.userName,
            customers,
            error: null,
            success: null
        });
    } catch (error) {
        console.error('Get customers error:', error);
        res.status(500).send('Error loading customers');
    }
};

// Get customer details
exports.getCustomerDetails = async (req, res) => {
    try {
        const customer = await Customer.findById(req.params.id);
        const orders = await Order.find({ 'customer.email': customer.email })
            .sort({ createdAt: -1 })
            .populate('items.product');
        
        res.render('admin/customer-details', { 
            user: req.session.userName,
            customer,
            orders
        });
    } catch (error) {
        console.error('Get customer details error:', error);
        res.status(500).send('Error loading customer details');
    }
};

// Delete customer
exports.deleteCustomer = async (req, res) => {
    try {
        await Customer.findByIdAndDelete(req.params.id);
        res.redirect('/admin/customers?success=Customer deleted successfully');
    } catch (error) {
        console.error('Delete customer error:', error);
        res.redirect('/admin/customers?error=Error deleting customer');
    }
};
