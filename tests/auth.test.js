const request = require('supertest');
const mongoose = require('mongoose');
const express = require('express');
const cookieParser = require('cookie-parser');
const authRoutes = require('../routes/auth');
const User = require('../models/User');

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use('/api/auth', authRoutes);

describe('Auth API', () => {
    beforeAll(async () => {
        // Mock MongoDB connection or use a test DB
        await mongoose.connect(process.env.MONGODB_URI_TEST || 'mongodb://localhost:27017/ambiora_test');
    });

    afterAll(async () => {
        await User.deleteMany({});
        await mongoose.connection.close();
    });

    it('should register a new user', async () => {
        const res = await request(app)
            .post('/api/auth/signup')
            .send({
                name: 'Test User',
                username: 'testuser',
                email: 'test@example.com',
                password: 'Password123'
            });

        expect(res.statusCode).toEqual(201);
        expect(res.body).toHaveProperty('token');
        expect(res.headers['set-cookie']).toBeDefined();
    });

    it('should login an existing user', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({
                email: 'test@example.com',
                password: 'Password123'
            });

        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('token');
        expect(res.headers['set-cookie']).toBeDefined();
    });
});
