const request = require('supertest');
const express = require('express');
const appointmentRoutes = require('../src/routes/appointment.routes');
const Appointment = require('../src/models/appointment.model');
const pool = require('../src/config/db.config');
const otpService = require('../src/utils/otp.service');

// Mock dependencies
jest.mock('../src/models/appointment.model');
jest.mock('../src/config/db.config', () => ({
    query: jest.fn()
}));
jest.mock('../src/utils/otp.service');

// Create a mock auth middleware
jest.mock('../src/middleware/auth.middleware', () => {
    return (req, res, next) => {
        req.user = { id: 1, role: 'patient' };
        next();
    };
});

const app = express();
app.use(express.json());
app.use('/api/appointments', appointmentRoutes);

describe('Appointment Management Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('POST /api/appointments/createAppointment', () => {
        it('should create an appointment successfully', async () => {
            const mockAppointment = {
                id: 1,
                patient_id: 1,
                doctor_id: 2,
                appointment_date: '2023-10-10',
                appointment_time: '10:00',
                appointment_type: 'consultation',
                reason: 'Checkup'
            };

            // Mock DB connection check
            pool.query.mockResolvedValueOnce({ rows: [] });

            Appointment.createAppointment.mockResolvedValue(mockAppointment);

            // Mock doctor email fetch
            pool.query.mockResolvedValueOnce({ rows: [{ email: 'doctor@test.com', first_name: 'Doc', last_name: 'Smith' }] });
            // Mock patient fetch
            pool.query.mockResolvedValueOnce({ rows: [{ first_name: 'John', last_name: 'Doe', email: 'pt@test.com' }] });

            otpService.sendGenericEmail.mockResolvedValue(true);

            const res = await request(app)
                .post('/api/appointments/createAppointment')
                .send({
                    doctorId: 2,
                    appointmentDate: '2023-10-10',
                    appointmentTime: '10:00',
                    appointmentType: 'consultation',
                    reason: 'Checkup'
                });

            expect(res.status).toBe(201);
            expect(res.body.success).toBe(true);
            expect(res.body.data.id).toBe(1);
            expect(Appointment.createAppointment).toHaveBeenCalledTimes(1);
        });
    });

    describe('GET /api/appointments/getAppointment', () => {
        it('should fetch appointments successfully', async () => {
            const mockAppointments = [
                { id: 1, patient_id: 1, doctor_id: 2, reason: 'Checkup' }
            ];

            Appointment.getAppointments.mockResolvedValue(mockAppointments);

            const res = await request(app)
                .get('/api/appointments/getAppointment')
                .query({ status: 'scheduled' });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data).toHaveLength(1);
            expect(Appointment.getAppointments).toHaveBeenCalledWith(1, 'patient', 'scheduled', undefined);
        });
    });
});
