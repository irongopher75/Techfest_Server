const mongoose = require('mongoose');

const registrationSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
    teamName: { type: String },
    teamMembers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    paymentMethod: { type: String, enum: ['upi_direct', 'none'], default: 'none' },
    transactionId: { type: String, required: false }, // UPI UTR/Transaction ID (Optional for simple reg)
    status: { type: String, enum: ['pending_verification', 'paid', 'failed', 'registered'], default: 'registered' },
    amountPaid: { type: Number, required: false }
}, { timestamps: true });

// Indexes for performance and data integrity
registrationSchema.index({ user: 1 });
registrationSchema.index({ event: 1 });
registrationSchema.index({ status: 1 });
registrationSchema.index({ user: 1, event: 1 }, { unique: true });

module.exports = mongoose.model('Registration', registrationSchema);
