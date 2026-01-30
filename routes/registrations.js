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
            .populate('teamMembers', 'name username email')
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
            .populate('user', 'name email college username')
            .populate('event', 'title category fee date eventType maxTeamSize')
            .populate('teamMembers', 'name username email college')
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
    const { eventId, teamName, teamMembers } = req.body;
    console.log(`Registration attempt: User ${req.user.id} for Event ${eventId}`);

    try {
        // Check if already registered (for group, check if any member is already registered)
        const existingRegs = await Registration.find({
            event: eventId,
            $or: [
                { user: req.user.id },
                { teamMembers: req.user.id },
                ...(teamMembers ? [{ user: { $in: teamMembers } }] : []),
                ...(teamMembers ? [{ teamMembers: { $in: teamMembers } }] : [])
            ]
        });

        if (existingRegs.length > 0) {
            return res.status(400).json({ message: 'One or more members are already registered for this event' });
        }

        const registration = new Registration({
            user: req.user.id,
            event: eventId,
            teamName,
            teamMembers,
            status: 'registered',
            paymentMethod: 'none'
        });

        await registration.save();
        res.json({ message: 'Registration successful!', registration });
    } catch (err) {
        console.error('Registration Route Error:', err);
        res.status(500).json({ message: 'Server error during registration', error: err.message });
    }
});

// @route   POST api/registrations/manual-upi
// @desc    Submit a manual UPI payment for verification
router.post('/manual-upi', auth, async (req, res) => {
    const { eventId, transactionId, amountPaid, teamName, teamMembers } = req.body;

    if (!transactionId) {
        return res.status(400).json({ message: 'Transaction ID (UTR) is required' });
    }

    try {
        const registration = new Registration({
            user: req.user.id,
            event: eventId,
            teamName,
            teamMembers,
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

// @route   POST api/registrations/verify/:id
// @desc    Verify/Approve a registration (Superior Admin only)
router.post('/verify/:id', auth, async (req, res) => {
    try {
        const registration = await Registration.findById(req.params.id);
        if (!registration) return res.status(404).json({ message: 'Registration not found' });

        registration.status = 'paid';
        await registration.save();
        res.json({ message: 'Registration verified successfully', registration });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

module.exports = router;
