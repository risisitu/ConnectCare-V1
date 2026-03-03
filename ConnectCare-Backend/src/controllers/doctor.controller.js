const Doctor = require('../models/doctor.model');
const jwt = require('jsonwebtoken');

class DoctorController {
    static async getAllDoctors(req, res) {
        try {
            const doctors = await Doctor.getAllDoctors();
            res.json({ success: true, data: doctors });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

    static async getDoctorAppointmentsById(req, res) {
        try {
            const doctorId = req.params.id;
            const { status, date } = req.query;
            const appointments = await Doctor.getDoctorAppointments(doctorId, status, date);
            res.json({ success: true, data: appointments });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

    static async getDoctorById(req, res) {
        try {
            const id = req.params.id;
            const doctor = await Doctor.getDoctorById(id);
            if (!doctor) {
                return res.status(404).json({ success: false, message: 'Doctor not found' });
            }
            res.json({ success: true, data: doctor });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

    static async getProfile(req, res) {
        try {
            const id = req.user.id; // From JWT middleware
            const doctor = await Doctor.getDoctorById(id);
            if (!doctor) {
                return res.status(404).json({ success: false, message: 'Doctor not found' });
            }
            res.json({ success: true, data: doctor });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

    static async signup(req, res) {
        try {
            console.log('Signup request body:', req.body);

            // Validate required fields
            const requiredFields = ['email', 'password', 'firstName', 'lastName', 'phoneNumber',
                'specialization', 'licenseNumber', 'experienceYears', 'clinicAddress'];

            for (const field of requiredFields) {
                if (!req.body[field]) {
                    return res.status(400).json({
                        success: false,
                        error: `${field} is required`
                    });
                }
            }

            // Convert experienceYears to number if it's a string
            const doctorData = {
                ...req.body,
                experienceYears: parseInt(req.body.experienceYears)
            };

            const newDoctor = await Doctor.createDoctor(doctorData);

            // Generate JWT token
            const token = jwt.sign(
                { id: newDoctor.id, email: newDoctor.email, role: 'doctor' },
                process.env.JWT_SECRET,
                { expiresIn: '24h' }
            );

            res.status(201).json({
                success: true,
                data: { ...newDoctor, token }
            });
        } catch (error) {
            console.error('Signup error:', error);
            if (error.message === 'Email already registered') {
                return res.status(400).json({ success: false, error: error.message });
            }
            res.status(500).json({ success: false, error: error.message });
        }
    }

    static async login(req, res) {
        try {
            const { email, password } = req.body;
            const doctor = await Doctor.login(email, password);

            // Generate JWT token
            const token = jwt.sign(
                { id: doctor.id, email: doctor.email, role: 'doctor' },
                process.env.JWT_SECRET,
                { expiresIn: '24h' }
            );

            res.json({
                success: true,
                data: { ...doctor, token }
            });
        } catch (error) {
            if (error.message === 'Doctor not found' || error.message === 'Invalid password') {
                return res.status(401).json({ success: false, error: 'Invalid credentials' });
            }
            res.status(500).json({ success: false, error: error.message });
        }
    }

    static async updateProfile(req, res) {
        try {
            const doctorId = req.user.id; // From JWT middleware
            const updateData = req.body;

            const updatedDoctor = await Doctor.updateProfile(doctorId, updateData);
            if (!updatedDoctor) {
                return res.status(400).json({ success: false, message: 'No valid fields to update' });
            }

            res.json({ success: true, data: updatedDoctor });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

    static async getMyPatients(req, res) {
        try {
            const doctorId = req.user.id; // From JWT middleware
            const patients = await Doctor.getDoctorPatients(doctorId);
            res.json({ success: true, data: patients });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

    static async getPatientById(req, res) {
        try {
            const doctorId = req.user.id; // From JWT middleware
            const patientId = req.params.patientId;
            const patient = await Doctor.getPatientById(doctorId, patientId);

            if (!patient) {
                return res.status(404).json({
                    success: false,
                    message: 'Patient not found or not associated with this doctor'
                });
            }

            res.json({ success: true, data: patient });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

    static async getMyAppointments(req, res) {
        try {
            const doctorId = req.user.id; // From JWT middleware
            const { status, date } = req.query;
            const appointments = await Doctor.getDoctorAppointments(doctorId, status, date);
            res.json({ success: true, data: appointments });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

    static async getDoctorReports(req, res) {
        try {
            const doctorId = req.user.id; // From JWT middleware
            const { status, date } = req.query;
            const reports = await Doctor.getDoctorReports(doctorId, status, date);
            res.json({ success: true, data: reports });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

    static async updateReportStatus(req, res) {
        try {
            const doctorId = req.user.id; // From JWT middleware
            const reportId = req.params.reportId;
            const { status, notes } = req.body;

            if (!status || !['approved', 'rejected', 'iterated'].includes(status)) {
                return res.status(400).json({
                    success: false,
                    error: "Status must be one of: 'approved', 'rejected', 'iterated'"
                });
            }

            const report = await Doctor.updateReportStatus(doctorId, reportId, status, notes);

            if (!report) {
                return res.status(404).json({
                    success: false,
                    message: 'Report not found or not associated with this doctor'
                });
            }

            res.json({ success: true, data: report });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

    static async getDoctorPatientsList(req, res) {
        try {
            const doctorId = req.params.doctorId;
            const patients = await Doctor.getDoctorPatients(doctorId);

            if (!patients || patients.length === 0) {
                return res.status(404).json({
                    success: true,
                    data: [],
                    message: 'No patients found for this doctor'
                });
            }

            res.json({ success: true, data: patients });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }
    static async getDoctorStats(req, res) {
        try {
            const doctorId = req.user.id;
            const stats = await Doctor.getDoctorStats(doctorId);
            res.json({ success: true, data: stats });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

    static async updateDoctorSettings(req, res) {
        try {
            const doctorId = req.user.id;
            const { monthly_target, daily_capacity, avg_consultation_time } = req.body;
            const updated = await Doctor.updateDoctorSettings(doctorId, { monthly_target, daily_capacity, avg_consultation_time });
            res.json({ success: true, data: updated });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }
    static async getAITimeSavedStats(req, res) {
        try {
            const doctorId = req.user.id;
            const Report = require('../models/report.model');
            const stats = await Report.getLastAIReportStats(doctorId);
            res.json({ success: true, data: stats });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }
    static async getNotifications(req, res) {
        try {
            const doctorId = req.user.id;
            const notifications = await Doctor.getLatestBookingNotifications(doctorId);
            res.json({ success: true, data: notifications });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

    static async getPatientHistory(req, res) {
        try {
            const doctorId = req.user.id;
            const patientId = req.params.patientId;
            const history = await Doctor.getPatientHistory(doctorId, patientId);
            res.json({ success: true, data: history });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }
}

module.exports = DoctorController;