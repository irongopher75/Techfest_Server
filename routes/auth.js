const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auth = require('../middleware/auth');
const { superiorAdmin } = require('../middleware/adminAuth');

// @route   POST api/auth/signup
// @desc    Register user or admin (pending approval)
router.post('/signup', async (req, res) => {
    const { name, username, email, password, college, role } = req.body;
    console.log(`Registration attempt for: ${email} as ${role || 'user'}`);

    try {
        let user = await User.findOne({
            $or: [{ email }, { username }]
        });

        if (user) {
            const field = user.email === email ? 'Email' : 'Username';
            return res.status(400).json({ message: `${field} already exists` });
        }

        // Only allow event_admin or user from public signup. 
        // superior_admin should be created via DB or initial setup.
        const userRole = role === 'event_admin' ? 'event_admin' : 'user';
        const isApproved = userRole === 'user'; // Admins are not approved by default

        user = new User({
            name,
            username,
            email,
            password,
            college,
            role: userRole,
            isApproved
        });

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);

        await user.save();
        console.log(`Entity saved successfully: ${email} (Role: ${userRole}, Approved: ${isApproved})`);

        const payload = { user: { id: user.id } };
        jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '2h' }, (err, token) => {
            if (err) throw err;
            res.json({
                token,
                user: {
                    id: user.id,
                    name: user.name,
                    username: user.username,
                    email: user.email,
                    role: user.role,
                    isApproved: user.isApproved
                }
            });
        });
    } catch (err) {
        console.error('Registration Error:', err);
        res.status(500).json({ message: 'Server error during registration', error: err.message });
    }
});

// @route   POST api/auth/login
// @desc    Authenticate user & get token
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        let user = await User.findOne({ email });
        if (!user) return res.status(400).json({ message: 'Invalid Credentials' });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: 'Invalid Credentials' });

        const payload = { user: { id: user.id } };
        jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '2h' }, (err, token) => {
            if (err) throw err;
            res.json({
                token,
                user: {
                    id: user.id,
                    name: user.name,
                    username: user.username,
                    email: user.email,
                    role: user.role,
                    isApproved: user.isApproved
                }
            });
        });
    } catch (err) {
        console.error('Login Error:', err.message);
        res.status(500).send('Server error');
    }
});

// --- ADMINISTRATIVE ROUTES (SUPERIOR ONLY) ---

// @route   GET api/auth/admins/all
// @desc    Get all administrative users
router.get('/admins/all', auth, superiorAdmin, async (req, res) => {
    try {
        const admins = await User.find({ role: { $ne: 'user' } }).select('-password').populate('assignedEvents', 'title category');
        res.json(admins);
    } catch (err) {
        res.status(500).send('Server error');
    }
});

// @route   GET api/auth/admins/pending
// @desc    Get all admins awaiting approval
router.get('/admins/pending', auth, superiorAdmin, async (req, res) => {
    try {
        const pending = await User.find({ role: 'event_admin', isApproved: false }).select('-password');
        res.json(pending);
    } catch (err) {
        res.status(500).send('Server error');
    }
});

// @route   PUT api/auth/admins/update/:id
// @desc    Approve/Reject admin or update event assignments
router.put('/admins/update/:id', auth, superiorAdmin, async (req, res) => {
    try {
        const { isApproved, assignedEvents, role } = req.body;
        let user = await User.findById(req.params.id);

        if (!user) return res.status(404).json({ message: 'User not found' });

        if (isApproved !== undefined) user.isApproved = isApproved;
        if (assignedEvents !== undefined) user.assignedEvents = assignedEvents;
        if (role !== undefined) user.role = role;

        await user.save();
        res.json({ message: 'Admin profile updated successfully', user });
    } catch (err) {
        res.status(500).send('Server error');
    }
});

module.exports = router;
