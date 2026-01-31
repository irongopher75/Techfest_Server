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
    category: { type: String, trim: true } // e.g., 'Technical', 'Cultural', 'Workshop'
}, { timestamps: true });

eventSchema.index({ category: 1 });
eventSchema.index({ date: 1 });

// Cascade delete registrations when an event is deleted
eventSchema.pre('deleteOne', { document: true, query: false }, async function (next) {
    const Registration = mongoose.model('Registration');
    await Registration.deleteMany({ event: this._id });
    next();
});

module.exports = mongoose.model('Event', eventSchema);
