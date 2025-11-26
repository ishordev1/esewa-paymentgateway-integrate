const Order = require('../models/Order');

// Get all orders
exports.getAllOrders = async (req, res) => {
    try {
        const orders = await Order.find()
            .sort({ createdAt: -1 })
            .populate('items.product');
        
        res.render('admin/orders', { 
            user: req.session.userName,
            orders,
            error: null,
            success: null
        });
    } catch (error) {
        console.error('Get orders error:', error);
        res.status(500).send('Error loading orders');
    }
};

// Get order details
exports.getOrderDetails = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id).populate('items.product');
        
        if (!order) {
            return res.redirect('/admin/orders?error=Order not found');
        }
        
        res.render('admin/order-details', { 
            user: req.session.userName,
            order
        });
    } catch (error) {
        console.error('Get order details error:', error);
        res.redirect('/admin/orders?error=Error loading order');
    }
};

// Update order status
exports.updateOrderStatus = async (req, res) => {
    try {
        const { orderStatus } = req.body;
        
        const order = await Order.findById(req.params.id);
        
        if (!order) {
            return res.redirect('/admin/orders?error=Order not found');
        }
        
        const oldStatus = order.orderStatus;
        order.orderStatus = orderStatus;
        await order.save();
        
        // Log status change
        console.log(`Order ${order.orderNumber} status changed from ${oldStatus} to ${orderStatus}`);
        console.log(`Customer: ${order.customer.name} (${order.customer.email})`);
        
        // TODO: Send email notification to customer about status change
        // You can integrate nodemailer here to send email notifications
        
        res.redirect('/admin/orders?success=Order status updated successfully');
    } catch (error) {
        console.error('Update order status error:', error);
        res.redirect('/admin/orders?error=Error updating order');
    }
};
