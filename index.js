const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const cluster = require('cluster');
const os = require('os');
const dns = require('dns');

dns.setServers(['8.8.8.8', '8.8.4.4']);
dotenv.config();

const numCPUs = os.cpus().length;

if (cluster.isMaster) {
    console.log(`Master ${process.pid} is running`);

    // Fork workers.
    for (let i = 0; i < Math.min(numCPUs, 4); i++) { // Limit to 4 for dev stability
        cluster.fork();
    }

    cluster.on('exit', (worker, code, signal) => {
        console.log(`worker ${worker.process.pid} died`);
        cluster.fork();
    });
} else {
    console.log('Server starting... MONGODB_URI is', process.env.MONGODB_URI ? 'defined' : 'MISSING');

    const app = express();
    const PORT = process.env.PORT || 5001;

    // Middleware
    app.use(cors({
        origin: true,
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
        allowedHeaders: ['Content-Type', 'x-auth-token']
    }));
    app.use(express.json());

    // MongoDB Connection
    mongoose.connect(process.env.MONGODB_URI)
        .then(() => console.log(`Worker ${process.pid} connected to MongoDB`))
        .catch((err) => console.error(`Worker ${process.pid} MongoDB connection error:`, err));

    // Basic Route
    app.get('/', (req, res) => {
        res.send('Techfest API is running');
    });

    // Import Routes
    app.use('/api/auth', require('./routes/auth'));
    app.use('/api/events', require('./routes/events'));
    app.use('/api/registrations', require('./routes/registrations'));

    app.listen(PORT, () => {
        console.log(`Worker ${process.pid} running on port ${PORT}`);
    });
}
