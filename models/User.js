const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    college: { type: String },
    profilePic: { type: String, default: '' },
    role: {
        type: String,
        enum: ['user', 'superior_admin', 'event_admin'],
        default: 'user'
    },
    isApproved: {
        type: Boolean,
        default: true
    },
    assignedEvents: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Event'
    }]
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
