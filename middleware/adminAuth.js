const User = require('../models/User');

/**
 * Middleware to verify strictly Superior Admin access.
 * Must be used AFTER the standard auth middleware.
 */
const superiorAdmin = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user || user.role !== 'superior_admin') {
            return res.status(403).json({ message: 'Access denied: Superior Admin clearance required' });
        }
        next();
    } catch (err) {
        console.error('Superior Admin Auth Error:', err);
        res.status(500).json({ message: 'Authorization server error' });
    }
};

/**
 * Middleware to verify either Event Admin or Superior Admin access.
 * Also checks if the admin account has been approved.
 * Must be used AFTER the standard auth middleware.
 */
const eventAdmin = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id);

        // Superior admins bypass all event-level checks
        if (user && user.role === 'superior_admin') {
            req.adminUser = user;
            return next();
        }

        if (!user || user.role !== 'event_admin') {
            return res.status(403).json({ message: 'Access denied: Event Admin clearance required' });
        }

        if (!user.isApproved) {
            return res.status(403).json({ message: 'Access denied: Your admin account is pending superior approval' });
        }

        req.adminUser = user; // Attach user to allow route to check assignedEvents
        next();
    } catch (err) {
        console.error('Event Admin Auth Error:', err);
        res.status(500).json({ message: 'Authorization server error' });
    }
};

module.exports = { superiorAdmin, eventAdmin };
