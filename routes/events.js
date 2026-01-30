const express = require('express');
const router = express.Router();
const Event = require('../models/Event');
const auth = require('../middleware/auth');
const { superiorAdmin, eventAdmin } = require('../middleware/adminAuth');

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
// @desc    Create an event (Superior Admin only)
router.post('/', auth, superiorAdmin, async (req, res) => {
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

// @route   PUT api/events/:id
// @desc    Update event (Superior or Assigned Event Admin)
router.put('/:id', auth, eventAdmin, async (req, res) => {
    try {
        const eventId = req.params.id;

        // Secondary admins can only update their assigned events
        if (req.adminUser.role === 'event_admin') {
            const isAssigned = req.adminUser.assignedEvents.some(id => id.toString() === eventId);
            if (!isAssigned) {
                return res.status(403).json({ message: 'Access denied: You are not assigned to manage this event' });
            }
        }

        const event = await Event.findByIdAndUpdate(eventId, { $set: req.body }, { new: true });
        if (!event) return res.status(404).json({ message: 'Event not found' });

        res.json(event);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

module.exports = router;
