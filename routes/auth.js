const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { check, validationResult } = require('express-validator');
const User = require('../models/User');
const auth = require('../middleware/auth');
const { superiorAdmin } = require('../middleware/adminAuth');

const generateTokens = (user) => {
    const accessToken = jwt.sign(
        { user: { id: user.id } },
        process.env.JWT_SECRET,
        { expiresIn: '15m' }
    );
    const refreshToken = jwt.sign(
        { user: { id: user.id } },
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: '7d' }
    );
    return { accessToken, refreshToken };
};

// @route   POST api/auth/signup
// @desc    Register user or admin (pending approval)
router.post('/signup', [
    check('name', 'Name is required').not().isEmpty(),
    check('username', 'Username is required').not().isEmpty(),
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Password must be 6 or more characters and include a number')
        .isLength({ min: 6 })
        .matches(/\d/)
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { name, username, email, password, college, role } = req.body;
    try {
        let user = await User.findOne({ $or: [{ email }, { username }] });
        if (user) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const userRole = role === 'event_admin' ? 'event_admin' : 'user';
        const isApproved = userRole === 'user';

        user = new User({ name, username, email, password, college, role: userRole, isApproved });

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);

        const { accessToken, refreshToken } = generateTokens(user);
        user.refreshToken = refreshToken;
        await user.save();

        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        res.json({
            token: accessToken,
            user: { id: user.id, name: user.name, username: user.username, email: user.email, role: user.role, isApproved: user.isApproved }
        });
    } catch (err) {
        console.error('Registration Error:', err);
        res.status(500).json({ message: 'Server error during registration' });
    }
});

// @route   POST api/auth/login
// @desc    Authenticate user & get token
router.post('/login', [
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Password is required').exists()
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;
    try {
        let user = await User.findOne({ email });
        if (!user) return res.status(400).json({ message: 'Invalid Credentials' });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: 'Invalid Credentials' });

        const { accessToken, refreshToken } = generateTokens(user);
        user.refreshToken = refreshToken;
        await user.save();

        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        res.json({
            token: accessToken,
            user: { id: user.id, name: user.name, username: user.username, email: user.email, role: user.role, isApproved: user.isApproved }
        });
    } catch (err) {
        console.error('Login Error:', err.message);
        res.status(500).send('Server error');
    }
});

// @route   POST api/auth/refresh-token
// @desc    Refresh access token
router.post('/refresh-token', async (req, res) => {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) return res.status(401).json({ message: 'No refresh token' });

    try {
        const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
        const user = await User.findById(decoded.user.id);

        if (!user || user.refreshToken !== refreshToken) {
            return res.status(403).json({ message: 'Invalid refresh token' });
        }

        const { accessToken, refreshToken: newRefreshToken } = generateTokens(user);
        user.refreshToken = newRefreshToken;
        await user.save();

        res.cookie('refreshToken', newRefreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        res.json({ token: accessToken });
    } catch (err) {
        res.status(401).json({ message: 'Invalid refresh token' });
    }
});

// @route   POST api/auth/logout
// @desc    Logout user
router.post('/logout', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (user) {
            user.refreshToken = null;
            await user.save();
        }
        res.clearCookie('refreshToken');
        res.json({ message: 'Logged out successfully' });
    } catch (err) {
        res.status(500).send('Server error');
    }
});

// @route   GET api/auth/me
// @desc    Get current user profile
router.get('/me', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        res.json(user);
    } catch (err) {
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
