const express = require('express');
const router = express.Router();
const Event = require('../models/Event');
const auth = require('../middleware/auth');
const { superiorAdmin, eventAdmin } = require('../middleware/adminAuth');
const logger = require('../utils/logger');
const { body, validationResult } = require('express-validator');

// @route   GET api/events
// @desc    Get all events
router.get('/', async (req, res) => {
    try {
        const events = await Event.find();
        res.json(events);
    } catch (err) {
        logger.error('Error fetching events:', err);
        res.status(500).send('Server error');
    }
});

// @route   POST api/events
// @desc    Create an event (Superior Admin only)
router.post('/', [
    auth, superiorAdmin,
    body('title', 'Title is required').notEmpty().trim(),
    body('description', 'Description is required').notEmpty().trim(),
    body('fee', 'Fee must be non-negative').isFloat({ min: 0 }),
    body('date', 'Valid date is required').isISO8601(),
    body('venue', 'Venue is required').notEmpty().trim(),
    body('category', 'Category is required').notEmpty().trim()
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    const { title, description, fee, date, venue, category } = req.body;
    try {
        const newEvent = new Event({ title, description, fee, date: new Date(date), venue, category });
        const event = await newEvent.save();
        res.json(event);
    } catch (err) {
        logger.error('Error creating event:', err);
        res.status(500).send('Server error');
    }
});

// @route   PUT api/events/:id
// @desc    Update event (Superior or Assigned Event Admin)
router.put('/:id', [
    auth, eventAdmin,
    body('fee', 'Fee must be non-negative').optional().isFloat({ min: 0 }),
    body('date', 'Valid date is required').optional().isISO8601()
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    try {
        const eventId = req.params.id;

        // Secondary admins can only update their assigned events
        if (req.adminUser.role === 'event_admin') {
            const isAssigned = req.adminUser.assignedEvents.some(id => id.toString() === eventId);
            if (!isAssigned) {
                return res.status(403).json({ message: 'Access denied: You are not assigned to manage this event' });
            }
        }

        const { title, description, fee, date, venue, category, maxParticipants, maxTeamSize } = req.body;

        const event = await Event.findByIdAndUpdate(eventId, { $set: req.body }, { new: true, runValidators: true });
        if (!event) return res.status(404).json({ message: 'Event not found' });

        res.json(event);
    } catch (err) {
        logger.error('Error updating event:', err);
        res.status(500).send('Server error');
    }
});

// @route   DELETE api/events/:id
// @desc    Delete an event (Superior Admin only)
router.delete('/:id', auth, superiorAdmin, async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);
        if (!event) return res.status(404).json({ message: 'Event not found' });

        await event.deleteOne();
        res.json({ message: 'Event removed successfully' });
    } catch (err) {
        logger.error('Error deleting event:', err);
        res.status(500).send('Server error');
    }
});

module.exports = router;
