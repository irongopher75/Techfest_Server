const express = require('express');
const router = express.Router();
const User = require('../models/User');
const auth = require('../middleware/auth');

// @route   GET api/users/find/:username
// @desc    Find user by username
router.get('/find/:username', auth, async (req, res) => {
    try {
        const user = await User.findOne({ username: req.params.username }).select('name username');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json(user);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

module.exports = router;
