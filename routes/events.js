const express = require('express');
const router = express.Router();
const Event = require('../models/Event');

// @route   GET api/events
// @desc    Get all events
router.get('/', async (req, res) => {
    try {
        const events = await Event.find();
        res.json(events);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// @route   POST api/events
// @desc    Create an event (Admin only ideally, but keeping it simple for now)
router.post('/', async (req, res) => {
    const { title, description, fee, date, venue, category } = req.body;
    try {
        const newEvent = new Event({ title, description, fee, date, venue, category });
        const event = await newEvent.save();
        res.json(event);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

module.exports = router;
