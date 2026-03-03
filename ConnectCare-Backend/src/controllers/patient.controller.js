const Patient = require('../models/patient.model');
const jwt = require('jsonwebtoken');

class PatientController {
    static async signup(req, res) {
        try {
            const patientData = req.body;
            const newPatient = await Patient.createPatient(patientData);
            
            // Generate JWT token
            const token = jwt.sign(
                { id: newPatient.id, email: newPatient.email, role: 'patient' },
                process.env.JWT_SECRET,
                { expiresIn: '24h' }
            );

            res.status(201).json({
                success: true,
                data: { ...newPatient, token }
            });
        } catch (error) {
            if (error.message === 'Email already registered') {
                return res.status(400).json({ success: false, error: error.message });
            }
            res.status(500).json({ success: false, error: error.message });
        }
    }

    static async login(req, res) {
        try {
            const { email, password } = req.body;
            const patient = await Patient.login(email, password);
            
            // Generate JWT token
            const token = jwt.sign(
                { id: patient.id, email: patient.email, role: 'patient' },
                process.env.JWT_SECRET,
                { expiresIn: '24h' }
            );

            res.json({
                success: true,
                data: { ...patient, token }
            });
        } catch (error) {
            if (error.message === 'Patient not found' || error.message === 'Invalid password') {
                return res.status(401).json({ success: false, error: 'Invalid credentials' });
            }
            res.status(500).json({ success: false, error: error.message });
        }
    }

    static async getProfile(req, res) {
        try {
            const patientId = req.user.id; // From JWT middleware
            const patient = await Patient.getPatientById(patientId);
            if (!patient) {
                return res.status(404).json({ success: false, message: 'Patient not found' });
            }
            res.json({ success: true, data: patient });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

    static async updateProfile(req, res) {
        try {
            const patientId = req.user.id; // From JWT middleware
            const updateData = req.body;
            
            const updatedPatient = await Patient.updateProfile(patientId, updateData);
            if (!updatedPatient) {
                return res.status(400).json({ success: false, message: 'No valid fields to update' });
            }

            res.json({ success: true, data: updatedPatient });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

    static async getMyAppointments(req, res) {
        try {
            const patientId = req.user.id; // From JWT middleware
            const { status, date } = req.query;
            const appointments = await Patient.getPatientAppointments(patientId, status, date);
            res.json({ success: true, data: appointments });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

    static async bookAppointment(req, res) {
        try {
            console.log('Full request:', {
                headers: req.headers,
                body: req.body,
                contentType: req.headers['content-type']
            });
            console.log('Patient ID from token:', req.user.id);
            
            // Check if request body exists
            if (!req.body || typeof req.body !== 'object') {
                return res.status(400).json({ 
                    success: false, 
                    error: 'Invalid request body format. Expected JSON object.' 
                });
            }

            // Validate required fields with detailed errors
            const requiredFields = ['doctorId', 'appointmentDate', 'appointmentTime', 'appointmentType', 'reason'];
            const missingFields = requiredFields.filter(field => !req.body[field]);
            
            if (missingFields.length > 0) {
                return res.status(400).json({ 
                    success: false, 
                    error: `Missing required fields: ${missingFields.join(', ')}` 
                });
            }

            const appointmentData = {
                doctorId: req.body.doctorId,
                appointmentDate: req.body.appointmentDate,
                appointmentTime: req.body.appointmentTime,
                appointmentType: req.body.appointmentType,
                reason: req.body.reason,
                patientId: req.user.id
            };

            console.log('Appointment data being sent to model:', appointmentData);

            const newAppointment = await Patient.bookAppointment(appointmentData);
            res.status(201).json({ success: true, data: newAppointment });
        } catch (error) {
            console.error('Error in bookAppointment:', error);
            if (error.message === 'Doctor not found' || error.message === 'This time slot is already booked') {
                return res.status(400).json({ success: false, error: error.message });
            }
            res.status(500).json({ success: false, error: error.message });
        }
    }
}

module.exports = PatientController;