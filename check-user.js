const mongoose = require('mongoose');
const dotenv = require('dotenv');
const dns = require('dns');
const User = require('./models/User');

dns.setServers(['8.8.8.8', '8.8.4.4']);
dotenv.config();

async function check() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');
        const user = await User.findOne({ email: 'vishnuupanicker01@gmail.com' });
        if (user) {
            console.log('User found:', user);
        } else {
            console.log('User not found');
        }
        process.exit();
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
}

check();
