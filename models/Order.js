const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    orderNumber: {
        type: String,
        unique: true
    },
    customer: {
        name: {
            type: String,
            required: true
        },
        email: {
            type: String,
            required: true
        },
        phone: {
            type: String,
            required: true
        },
        address: {
            street: String,
            city: String,
            state: String,
            zipCode: String
        }
    },
    items: [{
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            required: true
        },
        productName: String,
        variant: {
            size: String,
            price: Number
        },
        quantity: {
            type: Number,
            required: true,
            min: 1
        },
        price: {
            type: Number,
            required: true
        }
    }],
    totalAmount: {
        type: Number,
        required: true,
        min: 0
    },
    paymentMethod: {
        type: String,
        enum: ['eSewa', 'Cash on Delivery'],
        default: 'eSewa'
    },
    paymentStatus: {
        type: String,
        enum: ['Pending', 'Completed', 'Failed', 'Refunded'],
        default: 'Pending'
    },
    paymentDetails: {
        transactionId: String,
        refId: String,
        oid: String,
        paymentDate: Date
    },
    orderStatus: {
        type: String,
        enum: ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'],
        default: 'Pending'
    },
    notes: String
}, {
    timestamps: true
});

// Generate order number
orderSchema.pre('save', async function(next) {
    if (!this.orderNumber) {
        try {
            const count = await this.constructor.countDocuments();
            this.orderNumber = 'ORD-' + String(count + 1).padStart(6, '0');
        } catch (error) {
            return next(error);
        }
    }
    next();
});

module.exports = mongoose.model('Order', orderSchema);
