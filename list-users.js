const mongoose = require('mongoose');
const dotenv = require('dotenv');
const dns = require('dns');
const User = require('./models/User');

dns.setServers(['8.8.8.8', '8.8.4.4']);
dotenv.config();

async function listUsers() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');
        const users = await User.find({});
        console.log('System Users Summary:');
        users.forEach(u => {
            console.log(`- Email: ${u.email}, Username: ${u.username || 'MISSING'}, Role: ${u.role}`);
        });
        process.exit();
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
}

listUsers();
