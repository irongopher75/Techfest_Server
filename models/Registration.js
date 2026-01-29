const mongoose = require('mongoose');

const registrationSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
    razorpayOrderId: { type: String },
    razorpayPaymentId: { type: String },
    razorpaySignature: { type: String },
    paymentMethod: { type: String, enum: ['razorpay', 'upi_direct'], default: 'razorpay' },
    transactionId: { type: String }, // Manual UTR for upi_direct
    status: { type: String, enum: ['pending', 'paid', 'failed', 'pending_verification'], default: 'pending' },
    amountPaid: { type: Number, required: true }
}, { timestamps: true });

module.exports = mongoose.model('Registration', registrationSchema);
