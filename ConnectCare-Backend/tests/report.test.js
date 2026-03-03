const request = require('supertest');
const express = require('express');
const reportRoutes = require('../src/routes/report.routes');

const Report = require('../src/models/report.model');
const Appointment = require('../src/models/appointment.model');
const Message = require('../src/models/message.model');
const DeepSeekService = require('../src/services/deepseek.service');
const EmailService = require('../src/utils/email.service');
const Doctor = require('../src/models/doctor.model');

jest.mock('../src/models/report.model');
jest.mock('../src/models/appointment.model');
jest.mock('../src/models/message.model');
jest.mock('../src/services/deepseek.service');
jest.mock('../src/utils/email.service');
jest.mock('../src/models/doctor.model');

// Create a mock auth middleware
jest.mock('../src/middleware/auth.middleware', () => {
    return (req, res, next) => {
        req.user = { id: 1, role: 'doctor' };
        next();
    };
});

const app = express();
app.use(express.json());
app.use('/api', reportRoutes);

describe('Report Generation Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('POST /api/appointments/:appointmentId/ai-reports', () => {
        it('should generate an AI report successfully', async () => {
            const mockAppointment = {
                id: 1,
                patient_id: 2,
                doctor_id: 1,
                doctor_first_name: 'Doc',
                doctor_last_name: 'Smith',
                patient_first_name: 'John',
                patient_last_name: 'Doe'
            };

            const mockMessages = [
                { sender_name: 'Patient', content: 'Hello doctor, I have a headache.' },
                { sender_name: 'Doctor', content: 'Take some rest and paracetamol.' }
            ];

            const mockAIReportData = {
                assessment: 'Tension headache',
                treatment_plan: 'Paracetamol and rest',
                chief_complaint: 'Headache'
            };

            Appointment.checkAppointmentAccess.mockResolvedValue(true);
            Appointment.getAppointmentById.mockResolvedValue(mockAppointment);
            Message.getMessagesByAppointmentId.mockResolvedValue(mockMessages);
            DeepSeekService.generateMedicalReport.mockResolvedValue(mockAIReportData);
            Report.createReport.mockResolvedValue({ id: 100 });
            Appointment.updateAppointmentStatus.mockResolvedValue(true);
            Doctor.getDoctorById.mockResolvedValue({ email: 'doctor@test.com' });
            EmailService.sendMedicalReport.mockResolvedValue(true);

            const res = await request(app)
                .post('/api/appointments/1/ai-reports')
                .send();

            expect(res.status).toBe(201);
            expect(res.body.success).toBe(true);
            expect(res.body.data.id).toBe(100);
            expect(DeepSeekService.generateMedicalReport).toHaveBeenCalledWith('Patient: Hello doctor, I have a headache.\nDoctor: Take some rest and paracetamol.');
            expect(Report.createReport).toHaveBeenCalledWith(expect.objectContaining({
                diagnosis: 'Tension headache',
                prescription: 'Paracetamol and rest',
                aiGenerated: true
            }));
            expect(EmailService.sendMedicalReport).toHaveBeenCalledTimes(1);
        });

        it('should fail if unauthorized access to appointment', async () => {
            Appointment.checkAppointmentAccess.mockResolvedValue(false);

            const res = await request(app)
                .post('/api/appointments/1/ai-reports')
                .send();

            expect(res.status).toBe(403);
            expect(res.body.error).toBe('Unauthorized access to appointment');
        });
    });

    describe('POST /api/appointments/:appointmentId/reports', () => {
        it('should generate a manual report successfully', async () => {
            const mockAppointment = {
                id: 1,
                patient_id: 2,
                doctor_id: 1
            };

            Appointment.checkAppointmentAccess.mockResolvedValue(true);
            Appointment.getAppointmentById.mockResolvedValue(mockAppointment);
            Report.createReport.mockResolvedValue({ id: 101 });

            const res = await request(app)
                .post('/api/appointments/1/reports')
                .send({
                    diagnosis: 'Flu',
                    prescription: 'Rest',
                    notes: 'Stay hydrated.'
                });

            expect(res.status).toBe(201);
            expect(res.body.success).toBe(true);
            expect(res.body.data.id).toBe(101);
            expect(Report.createReport).toHaveBeenCalledWith(expect.objectContaining({
                diagnosis: 'Flu',
                aiGenerated: false
            }));
        });
    });
});
