const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    username: { type: String, required: true, unique: true },
    email: {
        type: String,
        required: true,
        unique: true,
        match: [/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/, 'Please fill a valid email address']
    },
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
    }],
    refreshToken: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
