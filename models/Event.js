const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    image: { type: String },
    fee: { type: Number, required: true }, // In INR
    date: { type: Date, required: true },
    venue: { type: String },
    maxParticipants: { type: Number },
    eventType: { type: String, enum: ['individual', 'group'], default: 'individual' },
    maxTeamSize: { type: Number, default: 1 },
    category: { type: String } // e.g., 'Technical', 'Cultural', 'Workshop'
}, { timestamps: true });

module.exports = mongoose.model('Event', eventSchema);
