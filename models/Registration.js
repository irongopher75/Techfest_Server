const mongoose = require('mongoose');

const registrationSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
    paymentMethod: { type: String, enum: ['upi_direct'], default: 'upi_direct' },
    transactionId: { type: String, required: true }, // UPI UTR/Transaction ID
    status: { type: String, enum: ['pending_verification', 'paid', 'failed'], default: 'pending_verification' },
    amountPaid: { type: Number, required: true }
}, { timestamps: true });

module.exports = mongoose.model('Registration', registrationSchema);
