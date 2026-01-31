const mongoose = require('mongoose');
const dotenv = require('dotenv');
const dns = require('dns');
const User = require('./models/User');

dns.setServers(['8.8.8.8', '8.8.4.4']);
dotenv.config();

async function fixUsernames() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const users = await User.find({ $or: [{ username: { $exists: false } }, { username: null }, { username: '' }] });
        console.log(`Found ${users.length} users needing username fixes.`);

        for (const user of users) {
            // Generate a username from email (part before @)
            let baseUsername = user.email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '_');

            // Check if username already exists
            let finalUsername = baseUsername;
            let counter = 1;
            while (await User.findOne({ username: finalUsername })) {
                finalUsername = `${baseUsername}${counter}`;
                counter++;
            }

            user.username = finalUsername;
            await user.save();
            console.log(`Updated user ${user.email} with username: ${finalUsername}`);
        }

        console.log('All usernames fixed.');
        process.exit();
    } catch (err) {
        console.error('Error during migration:', err);
        process.exit(1);
    }
}

fixUsernames();
