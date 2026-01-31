const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const cluster = require('cluster');
const os = require('os');
const dns = require('dns');
const path = require('path');

dns.setServers(['8.8.8.8', '8.8.4.4']);
dotenv.config();

const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const logger = require('./utils/logger');

const numCPUs = os.cpus().length;

if (cluster.isPrimary) {
    logger.info(`Master ${process.pid} is running`);

    // Fork workers.
    for (let i = 0; i < Math.min(numCPUs, 4); i++) { // Limit to 4 for dev stability
        cluster.fork();
    }

    cluster.on('exit', (worker, code, signal) => {
        logger.warn(`worker ${worker.process.pid} died`);
        cluster.fork();
    });
} else {
    logger.info('Server starting...');

    const app = express();
    const PORT = process.env.PORT || 5001;

    // Trust proxy for Render/Cloudflare
    app.set('trust proxy', 1);

    // Security Middleware
    app.use(helmet()); // Set security HTTP headers
    app.use(mongoSanitize()); // Prevent NoSQL injection
    app.use(compression()); // Compress responses
    app.use(cookieParser()); // Parse cookies

    // Rate Limiting
    const apiLimiter = rateLimit({
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 100, // Limit each IP to 100 requests per windowMs
        message: 'Too many requests from this IP, please try again after 15 minutes'
    });
    app.use('/api/', apiLimiter);

    const authLimiter = rateLimit({
        windowMs: 60 * 60 * 1000, // 1 hour
        max: 20, // Limit each IP to 20 login/signup attempts per hour
        message: 'Too many authentication attempts, please try again after an hour'
    });
    app.use('/api/auth/', authLimiter);

    // Middleware
    app.use(cors({
        origin: process.env.CLIENT_URL || true,
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
        allowedHeaders: ['Content-Type', 'x-auth-token']
    }));
    app.use(express.json());

    // Static Assets Caching
    app.use('/assets', express.static(path.join(__dirname, 'public/assets'), {
        maxAge: '1d',
        etag: true
    }));

    // MongoDB Connection
    mongoose.connect(process.env.MONGODB_URI)
        .then(() => logger.info(`Worker ${process.pid} connected to MongoDB`))
        .catch((err) => logger.error(`Worker ${process.pid} MongoDB connection error:`, err));

    // Health Check Route
    app.get('/health', (req, res) => {
        res.status(200).json({ status: 'healthy', worker: process.pid, uptime: process.uptime() });
    });

    // Basic Route
    app.get('/', (req, res) => {
        res.send('Ambiora API is running');
    });

    // Import Routes
    app.use('/api/auth', require('./routes/auth'));
    app.use('/api/events', require('./routes/events'));
    app.use('/api/registrations', require('./routes/registrations'));
    app.use('/api/users', require('./routes/users'));

    const errorHandler = require('./middleware/errorHandler');
    app.use(errorHandler);

    const server = app.listen(PORT, () => {
        logger.info(`Worker ${process.pid} running on port ${PORT}`);
    });

    // Graceful Shutdown
    process.on('SIGTERM', () => {
        logger.info('SIGTERM signal received: closing HTTP server');
        server.close(() => {
            logger.info('HTTP server closed');
            mongoose.connection.close(false, () => {
                logger.info('Mongo connection closed');
                process.exit(0);
            });
        });
    });
}
