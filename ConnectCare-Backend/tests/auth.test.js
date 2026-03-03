const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');
const patientRoutes = require('../src/routes/patient.routes');
const Patient = require('../src/models/patient.model');

jest.mock('../src/models/patient.model');
jest.mock('jsonwebtoken');

const app = express();
app.use(express.json());
app.use('/api/patients', patientRoutes);

describe('Patient Authentication Auth Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        process.env.JWT_SECRET = 'test_secret';
    });

    describe('POST /api/patients/signup', () => {
        it('should register a new patient successfully', async () => {
            const mockPatient = {
                id: 1,
                email: 'test@example.com',
                firstName: 'John',
                lastName: 'Doe',
                role: 'patient'
            };

            Patient.createPatient.mockResolvedValue(mockPatient);
            jwt.sign.mockReturnValue('mocked_token');

            const res = await request(app)
                .post('/api/patients/signup')
                .send({
                    email: 'test@example.com',
                    password: 'password123',
                    firstName: 'John',
                    lastName: 'Doe'
                });

            expect(res.status).toBe(201);
            expect(res.body.success).toBe(true);
            expect(res.body.data.email).toBe('test@example.com');
            expect(res.body.data.token).toBe('mocked_token');
            expect(Patient.createPatient).toHaveBeenCalledTimes(1);
        });

        it('should return error if email already registered', async () => {
            Patient.createPatient.mockRejectedValue(new Error('Email already registered'));

            const res = await request(app)
                .post('/api/patients/signup')
                .send({
                    email: 'test@example.com',
                    password: 'password123',
                    firstName: 'John',
                    lastName: 'Doe'
                });

            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
            expect(res.body.error).toBe('Email already registered');
        });
    });

    describe('POST /api/patients/login', () => {
        it('should login patient successfully', async () => {
            const mockPatient = {
                id: 1,
                email: 'test@example.com',
                role: 'patient'
            };

            Patient.login.mockResolvedValue(mockPatient);
            jwt.sign.mockReturnValue('mocked_token');

            const res = await request(app)
                .post('/api/patients/login')
                .send({
                    email: 'test@example.com',
                    password: 'password123'
                });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data.token).toBe('mocked_token');
            expect(Patient.login).toHaveBeenCalledWith('test@example.com', 'password123');
        });

        it('should return 401 on invalid credentials', async () => {
            Patient.login.mockRejectedValue(new Error('Invalid password'));

            const res = await request(app)
                .post('/api/patients/login')
                .send({
                    email: 'test@example.com',
                    password: 'wrongpassword'
                });

            expect(res.status).toBe(401);
            expect(res.body.success).toBe(false);
            expect(res.body.error).toBe('Invalid credentials');
        });
    });
});
