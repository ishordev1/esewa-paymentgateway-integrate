const Order = require('../models/Order');
const Customer = require('../models/Customer');
const Product = require('../models/Product');
const esewaPayment = require('../config/esewa');

// Initiate payment
exports.initiatePayment = async (req, res) => {
    try {
        const { name, email, phone, street, city, state, zipCode, notes, items, totalAmount } = req.body;
        
        // Validate required fields
        if (!name || !email || !phone || !items || !totalAmount) {
            return res.status(400).send('Missing required fields. Please fill all required information.');
        }
        
        // Parse items
        let cartItems;
        try {
            cartItems = JSON.parse(items);
        } catch (e) {
            return res.status(400).send('Invalid cart data. Please try again.');
        }
        
        if (!cartItems || cartItems.length === 0) {
            return res.status(400).send('Your cart is empty. Please add items before checkout.');
        }
        
        // Create order items with product references
        const orderItems = [];
        for (const item of cartItems) {
            const product = await Product.findById(item.productId);
            if (!product) {
                console.log(`Product not found: ${item.productId}`);
                continue;
            }
            
            orderItems.push({
                product: product._id,
                productName: item.productName,
                variant: item.variant,
                quantity: item.quantity,
                price: item.variant.price * item.quantity
            });
            
            // Update product stock
            const variantIndex = product.variants.findIndex(v => v.size === item.variant.size);
            if (variantIndex !== -1) {
                product.variants[variantIndex].stock -= item.quantity;
                await product.save();
            }
        }
        
        if (orderItems.length === 0) {
            return res.status(400).send('No valid products in cart. Please add products and try again.');
        }
        
        // Create order
        const order = new Order({
            customer: {
                name,
                email,
                phone,
                address: { 
                    street: street || '',
                    city: city || '',
                    state: state || '',
                    zipCode: zipCode || ''
                }
            },
            items: orderItems,
            totalAmount: parseFloat(totalAmount),
            paymentMethod: 'eSewa',
            paymentStatus: 'Pending',
            orderStatus: 'Pending',
            notes: notes || ''
        });
        
        await order.save();
        console.log('Order created:', order.orderNumber);
        
        // Create or update customer record
        let customer = await Customer.findOne({ email });
        if (customer) {
            customer.name = name;
            customer.phone = phone;
            customer.address = { street, city, state, zipCode };
            customer.totalOrders += 1;
            await customer.save();
        } else {
            customer = new Customer({
                name,
                email,
                phone,
                address: { street, city, state, zipCode },
                totalOrders: 1
            });
            await customer.save();
        }
        
        // Generate eSewa payment data
        const paymentData = esewaPayment.createPaymentData(
            order.orderNumber,
            totalAmount,
            'Nursery Plants Order'
        );
        
        console.log('Payment data generated:', paymentData);
        
        // Store transaction UUID in order
        order.paymentDetails = {
            oid: paymentData.transaction_uuid
        };
        await order.save();
        
        // Render payment form
        res.render('customer/esewa-payment', {
            paymentData,
            paymentUrl: esewaPayment.getPaymentUrl(),
            order
        });
        
    } catch (error) {
        console.error('Payment initiation error:', error);
        console.error('Error stack:', error.stack);
        res.status(500).send(`Error processing payment: ${error.message}. Please try again or contact support.`);
    }
};

// Payment success callback
exports.paymentSuccess = async (req, res) => {
    try {
        // eSewa sends response as base64 encoded data
        const encodedData = req.query.data;
        
        if (!encodedData) {
            console.error('No data received from eSewa');
            return res.redirect('/payment/failure');
        }
        
        // Decode base64 data
        const decodedData = Buffer.from(encodedData, 'base64').toString('utf-8');
        const responseData = JSON.parse(decodedData);
        
        console.log('eSewa Response:', responseData);
        
        const { 
            transaction_code, 
            status, 
            total_amount, 
            transaction_uuid, 
            product_code, 
            signed_field_names, 
            signature
        } = responseData;
        
        // Verify signature
        const isValid = esewaPayment.verifySignature({
            transaction_code,
            status,
            total_amount,
            transaction_uuid,
            product_code,
            signed_field_names,
            signature
        });
        
        if (!isValid) {
            console.error('Invalid signature');
            return res.redirect('/payment/failure');
        }
        
        if (status !== 'COMPLETE') {
            console.error('Payment not completed:', status);
            return res.redirect('/payment/failure');
        }
        
        // Find order by transaction UUID
        const order = await Order.findOne({ 'paymentDetails.oid': transaction_uuid });
        
        if (!order) {
            console.error('Order not found for transaction:', transaction_uuid);
            return res.redirect('/payment/failure');
        }
        
        // Update order payment status
        order.paymentStatus = 'Completed';
        order.orderStatus = 'Processing';
        order.paymentDetails = {
            transactionId: transaction_code,
            refId: responseData.ref_id || '',
            oid: transaction_uuid,
            paymentDate: new Date()
        };
        await order.save();
        
        // Update customer total spent
        const customer = await Customer.findOne({ email: order.customer.email });
        if (customer) {
            customer.totalSpent += order.totalAmount;
            await customer.save();
        }
        
        res.render('customer/payment-success', { order });
        
    } catch (error) {
        console.error('Payment success error:', error);
        res.redirect('/payment/failure');
    }
};

// Payment failure callback
exports.paymentFailure = async (req, res) => {
    try {
        const { transaction_uuid } = req.query;
        
        if (transaction_uuid) {
            // Find and update order status
            const order = await Order.findOne({ 'paymentDetails.oid': transaction_uuid });
            if (order) {
                order.paymentStatus = 'Failed';
                await order.save();
                
                // Restore product stock
                for (const item of order.items) {
                    const product = await Product.findById(item.product);
                    if (product) {
                        const variantIndex = product.variants.findIndex(v => v.size === item.variant.size);
                        if (variantIndex !== -1) {
                            product.variants[variantIndex].stock += item.quantity;
                            await product.save();
                        }
                    }
                }
            }
        }
        
        res.render('customer/payment-failure');
        
    } catch (error) {
        console.error('Payment failure error:', error);
        res.render('customer/payment-failure');
    }
};
