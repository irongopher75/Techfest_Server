const mongoose = require('mongoose');
const dotenv = require('dotenv');
const dns = require('dns');
const Event = require('./models/Event');

dns.setServers(['8.8.8.8', '8.8.4.4']);
dotenv.config();

const events = [
    {
        title: "Hack-O-Rama 2026",
        description: "A 24-hour national level hackathon where innovation meets execution. Build real-world solutions for real-world problems.",
        fee: 499,
        date: new Date('2026-03-15'),
        venue: "Main Audi",
        category: "Technical"
    },
    {
        title: "Code Gladiators",
        description: "Competitive programming contest to test your data structures and algorithms skills against the best.",
        fee: 199,
        date: new Date('2026-03-16'),
        venue: "CS Lab 1",
        category: "Technical"
    },
    {
        title: "Robo-Wars",
        description: "The ultimate battle of steel and circuits. Design your bot and dominate the arena.",
        fee: 599,
        date: new Date('2026-03-17'),
        venue: "Robotics Arena",
        category: "Technical"
    },
    {
        title: "UI/UX Design Sprit",
        description: "Showcase your design thinking and create stunning user experiences for modern applications.",
        fee: 299,
        date: new Date('2026-03-18'),
        venue: "Design Studio",
        category: "Creative"
    }
];

mongoose.connect(process.env.MONGODB_URI)
    .then(async () => {
        console.log('Connected for seeding...');
        await Event.deleteMany({});
        await Event.insertMany(events);
        console.log('Seeded events successfully!');
        process.exit();
    })
    .catch(err => {
        console.error(err);
        process.exit(1);
    });
