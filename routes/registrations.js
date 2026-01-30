const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { eventAdmin } = require('../middleware/adminAuth');
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

// @route   GET api/registrations/all
// @desc    Get filtered registrations (Superior sees all, Event Admin sees assigned only)
router.get('/all', auth, eventAdmin, async (req, res) => {
    try {
        let query = {};

        // If they are an event_admin (and NOT a superior_admin), filter results
        if (req.adminUser.role === 'event_admin') {
            query = { event: { $in: req.adminUser.assignedEvents } };
        }

        const registrations = await Registration.find(query)
            .populate('user', 'name email college')
            .populate('event', 'title category fee date')
            .sort({ createdAt: -1 });

        res.json(registrations);
    } catch (err) {
        console.error('Registration Fetch Error:', err);
        res.status(500).json({ message: 'Server error while fetching registrations' });
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

// @route   POST api/registrations/register
// @desc    Simplified registration for an event
router.post('/register', auth, async (req, res) => {
    const { eventId } = req.body;
    console.log(`Registration attempt: User ${req.user.id} for Event ${eventId}`);

    try {
        // Check if already registered
        let registration = await Registration.findOne({
            user: req.user.id,
            event: eventId
        });

        if (registration) {
            console.log(`User ${req.user.id} is already registered for event ${eventId}`);
            return res.status(400).json({ message: 'You are already registered for this event' });
        }

        registration = new Registration({
            user: req.user.id,
            event: eventId,
            status: 'registered',
            paymentMethod: 'none'
        });

        await registration.save();
        console.log(`Registration successful for User ${req.user.id} and Event ${eventId}`);
        res.json({
            message: 'Registration successful!',
            registration
        });
    } catch (err) {
        console.error('Registration Route Error:', err);
        res.status(500).json({ message: 'Server error during registration', error: err.message });
    }
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
