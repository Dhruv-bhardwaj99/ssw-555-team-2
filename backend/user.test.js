const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const userRoutes = require('./routes/userRoutes'); 
const User = require('./models/User');

const app = express();
app.use(express.json());
app.use('/api/users', userRoutes);

beforeAll(async () => {
    const url = `mongodb://127.0.0.1/user_test_db`;
    await mongoose.connect(url);
});

afterAll(async () => {
    await mongoose.connection.db.dropDatabase();
    await mongoose.connection.close();
});

describe('User Registration (Sprint 1 Story)', () => {
    
    test('Should successfully create a patient user', async () => {
        const res = await request(app)
            .post('/api/users')
            .send({
                name: "Dhruv Test",
                email: "dhruv@stevens.edu",
                password: "password123",
                role: "patient"
            });
        
        expect(res.statusCode).toBe(201);
        expect(res.body.name).toBe("Dhruv Test");
        expect(res.body).toHaveProperty('_id');
    });

    test('Should return 400 if password is missing', async () => {
        const res = await request(app)
            .post('/api/users')
            .send({
                name: "Dhruv Test",
                email: "dhruv@stevens.edu",
                role: "patient"
            });
        
        expect(res.statusCode).toBe(400);
    });
});