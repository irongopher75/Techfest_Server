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

// @route   GET api/registrations/upi-details
// @desc    Get UPI ID for payment
router.get('/upi-details', auth, (req, res) => {
    res.json({
        upiId: process.env.ADMIN_UPI_ID || 'vishnurocky49@okhdfcbank',
        merchantName: 'Techfest'
    });
});

// @route   POST api/registrations/manual-upi
// @desc    Submit a manual UPI payment for verification
router.post('/manual-upi', auth, async (req, res) => {
    const { eventId, transactionId, amountPaid } = req.body;

    if (!transactionId) {
        return res.status(400).json({ message: 'Transaction ID (UTR) is required' });
    }

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
        res.json({
            message: 'Registration submitted for verification. Please wait for admin approval.',
            registration,
            upiUsed: process.env.ADMIN_UPI_ID || 'vishnurocky49@okhdfcbank'
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

module.exports = router;
