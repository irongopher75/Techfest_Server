const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const dns = require('dns');

dns.setServers(['8.8.8.8', '8.8.4.4']);
dotenv.config();

async function promote() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const email = 'vishnuupanicker01@gmail.com'; // Adjust if needed
        const user = await User.findOne({ email });

        if (!user) {
            console.log('User not found. Please sign up first.');
            process.exit(1);
        }

        user.role = 'superior_admin';
        user.isApproved = true;
        await user.save();

        console.log(`User ${email} promoted to superior_admin!`);
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

promote();
