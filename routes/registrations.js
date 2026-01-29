const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Registration = require('../models/Registration');

// @route   GET api/registrations/my
// @desc    Get current user's registrations
router.get('/my', auth, async (req, res) => {
    try {
        const registrations = await Registration.find({ user: req.user.id })
            .populate('event')
            .sort({ createdAt: -1 });
        res.json(registrations);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// @route   POST api/registrations/manual-upi
// @desc    Submit a manual UPI payment for verification
router.post('/manual-upi', auth, async (req, res) => {
    const { eventId, transactionId, amountPaid } = req.body;
    try {
        const registration = new Registration({
            user: req.user.id,
            event: eventId,
            transactionId,
            amountPaid,
            paymentMethod: 'upi_direct',
            status: 'pending_verification'
        });
        await registration.save();
        res.json({ message: 'Registration submitted for verification', registration });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

module.exports = router;
