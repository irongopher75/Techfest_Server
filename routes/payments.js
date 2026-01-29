const express = require('express');
const router = express.Router();
const Razorpay = require('razorpay');
const crypto = require('crypto');
const auth = require('../middleware/auth');
const Registration = require('../models/Registration');
const Event = require('../models/Event');

// Initialize Razorpay
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});

// @route   POST api/payments/create-order
// @desc    Create a Razorpay order
router.post('/create-order', auth, async (req, res) => {
    const { eventId } = req.body;
    try {
        const event = await Event.findById(eventId);
        if (!event) return res.status(404).json({ message: 'Event not found' });

        const options = {
            amount: event.fee * 100, // amount in the smallest currency unit (paise)
            currency: "INR",
            receipt: `receipt_order_${Math.floor(Math.random() * 1000000)}`
        };

        const order = await razorpay.orders.create(options);

        // Create a pending registration
        const registration = new Registration({
            user: req.user.id,
            event: eventId,
            razorpayOrderId: order.id,
            amountPaid: event.fee,
            status: 'pending'
        });
        await registration.save();

        res.json(order);
    } catch (err) {
        console.error(err);
        res.status(500).send('Error creating order');
    }
});

// @route   POST api/payments/verify
// @desc    Verify Razorpay payment signature
router.post('/verify', auth, async (req, res) => {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    const body = razorpay_order_id + "|" + razorpay_payment_id;

    const expectedSignature = crypto
        .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
        .update(body.toString())
        .digest("hex");

    const isAuthentic = expectedSignature === razorpay_signature;

    if (isAuthentic) {
        // Update registration status
        await Registration.findOneAndUpdate(
            { razorpayOrderId: razorpay_order_id },
            {
                razorpayPaymentId: razorpay_payment_id,
                razorpaySignature: razorpay_signature,
                status: 'paid'
            }
        );
        res.json({ message: 'Payment verified successfully', success: true });
    } else {
        res.status(400).json({ message: 'Payment verification failed', success: false });
    }
});

module.exports = router;
