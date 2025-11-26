const crypto = require('crypto');

class EsewaPayment {
    constructor() {
        this.merchantId = process.env.ESEWA_MERCHANT_ID || 'EPAYTEST';
        this.secretKey = process.env.ESEWA_SECRET_KEY || '8gBm/:&EnhH.1/q';
        this.paymentUrl = process.env.ESEWA_PAYMENT_URL || 'https://rc-epay.esewa.com.np/api/epay/main/v2/form';
        this.successUrl = process.env.ESEWA_SUCCESS_URL || 'http://localhost:3000/payment/success';
        this.failureUrl = process.env.ESEWA_FAILURE_URL || 'http://localhost:3000/payment/failure';
        
        console.log('eSewa Config:', {
            merchantId: this.merchantId,
            paymentUrl: this.paymentUrl,
            hasSecretKey: !!this.secretKey
        });
    }
    
    /**
     * Generate payment signature for eSewa
     */
    generateSignature(message) {
        const hash = crypto.createHmac('sha256', this.secretKey)
            .update(message)
            .digest('base64');
        return hash;
    }
    
    /**
     * Create payment form data
     */
    createPaymentData(orderId, amount, productName) {
        const totalAmount = amount.toString();
        const transactionUuid = `${orderId}-${Date.now()}`;
        
        // Message format for signature: total_amount,transaction_uuid,product_code
        const message = `total_amount=${totalAmount},transaction_uuid=${transactionUuid},product_code=${this.merchantId}`;
        const signature = this.generateSignature(message);
        
        return {
            amount: totalAmount,
            tax_amount: "0",
            total_amount: totalAmount,
            transaction_uuid: transactionUuid,
            product_code: this.merchantId,
            product_service_charge: "0",
            product_delivery_charge: "0",
            success_url: this.successUrl,
            failure_url: this.failureUrl,
            signed_field_names: "total_amount,transaction_uuid,product_code",
            signature: signature
        };
    }
    
    /**
     * Verify payment signature from eSewa response
     */
    verifySignature(data) {
        const message = `transaction_code=${data.transaction_code},status=${data.status},total_amount=${data.total_amount},transaction_uuid=${data.transaction_uuid},product_code=${this.merchantId},signed_field_names=${data.signed_field_names}`;
        
        const generatedSignature = this.generateSignature(message);
        return generatedSignature === data.signature;
    }
    
    getPaymentUrl() {
        return this.paymentUrl;
    }
}

module.exports = new EsewaPayment();
