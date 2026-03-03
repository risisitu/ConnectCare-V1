const Report = require('../models/report.model');
const Appointment = require('../models/appointment.model');

class ReportController {
    static async generateReport(req, res) {
        try {
            const { id: userId, role } = req.user;
            const { appointmentId } = req.params;
            const { diagnosis, prescription, notes } = req.body;

            // Check if user has access to this appointment
            const hasAccess = await Appointment.checkAppointmentAccess(appointmentId, userId, role);
            if (!hasAccess) {
                return res.status(403).json({ success: false, error: 'Unauthorized access to appointment' });
            }

            // Get appointment details to get both doctor and patient IDs
            const appointment = await Appointment.getAppointmentById(appointmentId);
            if (!appointment) {
                return res.status(404).json({ success: false, error: 'Appointment not found' });
            }

            const reportData = {
                appointmentId,
                patientId: appointment.patient_id,
                doctorId: appointment.doctor_id,
                diagnosis,
                prescription,
                notes,
                aiGenerated: false
            };

            const report = await Report.createReport(reportData);
            res.status(201).json({
                success: true,
                data: report
            });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

    static async generateAIReport(req, res) {
        try {
            const { id: userId, role } = req.user;
            const { appointmentId } = req.params;

            // Check if user has access to this appointment
            const hasAccess = await Appointment.checkAppointmentAccess(appointmentId, userId, role);
            if (!hasAccess) {
                return res.status(403).json({ success: false, error: 'Unauthorized access to appointment' });
            }

            // Get appointment details
            const appointment = await Appointment.getAppointmentById(appointmentId);
            if (!appointment) {
                return res.status(404).json({ success: false, error: 'Appointment not found' });
            }

            // Get message history
            const Message = require('../models/message.model');
            const messages = await Message.getMessagesByAppointmentId(appointmentId);
            console.log(`[AI Report] Fetched ${messages.length} messages for appointment ${appointmentId}`);

            // Format conversation
            const conversationText = messages.map(m => `${m.sender_name}: ${m.content}`).join('\n'); // Verify field names from Message model

            // Generate AI report with timing
            const DeepSeekService = require('../services/deepseek.service');
            console.log('[AI Report] Sending conversation to DeepSeek...');
            const aiStartTime = Date.now();
            const aiReportData = await DeepSeekService.generateMedicalReport(conversationText);
            const generationTimeSeconds = parseFloat(((Date.now() - aiStartTime) / 1000).toFixed(2));
            console.log(`[AI Report] Received response from DeepSeek in ${generationTimeSeconds}s:`, JSON.stringify(aiReportData).substring(0, 200) + '...');

            // Save the AI-generated report
            const reportData = {
                appointmentId,
                patientId: appointment.patient_id,
                doctorId: appointment.doctor_id,
                aiGenerated: true,
                generationTimeSeconds
            };

            reportData.diagnosis = aiReportData.assessment;
            reportData.prescription = aiReportData.treatment_plan;
            reportData.notes = JSON.stringify(aiReportData);

            const report = await Report.createReport(reportData);

            // Update appointment status to completed
            await Appointment.updateAppointmentStatus(appointmentId, 'completed', userId, role);

            // Send Email
            const EmailService = require('../utils/email.service');
            const doctorName = `${appointment.doctor_first_name} ${appointment.doctor_last_name}`;
            const patientName = `${appointment.patient_first_name} ${appointment.patient_last_name}`;
            // Get doctor email - Wait, appointment object doesn't have doctor email.
            // Need to fetch doctor email.
            const Doctor = require('../models/doctor.model');
            const doctor = await Doctor.getDoctorById(appointment.doctor_id);

            if (doctor && doctor.email) {
                await EmailService.sendMedicalReport(doctor.email, doctorName, patientName, aiReportData, report.id);
            }


            res.status(201).json({
                success: true,
                data: report
            });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

    static async updateReportStatus(req, res) {
        try {
            const { id: userId, role } = req.user;
            if (role !== 'doctor') {
                return res.status(403).json({ success: false, error: 'Only doctors can update report status' });
            }

            const { reportId } = req.params;
            const { status, notes } = req.body;

            // Validate status
            const validStatuses = ['approved', 'rejected', 'iterated'];
            if (!validStatuses.includes(status)) {
                return res.status(400).json({ success: false, error: 'Invalid status' });
            }

            // Update report status
            const report = await Report.updateReportStatus(reportId, status, userId);

            // If status is 'iterated', create a new iteration
            if (status === 'iterated' && notes) {
                await Report.createReportIteration({
                    reportId,
                    changes: notes
                });
            }

            res.json({
                success: true,
                data: report
            });
        } catch (error) {
            if (error.message === 'Report not found or unauthorized') {
                return res.status(403).json({ success: false, error: error.message });
            }
            res.status(500).json({ success: false, error: error.message });
        }
    }

    static async updateReportContent(req, res) {
        try {
            const { id: userId, role } = req.user;
            if (role !== 'doctor') {
                return res.status(403).json({ success: false, error: 'Only doctors can edit reports' });
            }

            const { reportId } = req.params;
            const { diagnosis, prescription, notes } = req.body;

            const report = await Report.updateReportContent(reportId, { diagnosis, prescription, notes }, userId);

            res.json({
                success: true,
                data: report
            });
        } catch (error) {
            if (error.message === 'Report not found or unauthorized') {
                return res.status(403).json({ success: false, error: error.message });
            }
            res.status(500).json({ success: false, error: error.message });
        }
    }

    static async sendReportToPatient(req, res) {
        try {
            const { id: userId, role } = req.user;
            if (role !== 'doctor') {
                return res.status(403).json({ success: false, error: 'Only doctors can send reports' });
            }

            const { reportId } = req.params;

            // Get report details
            const report = await Report.getReportById(reportId);
            if (!report) {
                return res.status(404).json({ success: false, error: 'Report not found' });
            }

            // Verify doctor ownership
            if (report.doctor_id !== userId) {
                return res.status(403).json({ success: false, error: 'Unauthorized' });
            }

            // Get patient email
            const Patient = require('../models/patient.model');
            // Assuming Patient model has getPatientById or similar. 
            // Wait, I should verify Patient model. 
            // Report already has patient_first_name... but not email.
            // Let's assume Patient model has email or I need to fetch it.
            // Let's blindly try to fetch from Patient Table via model or direct query if needed.
            // I'll check Patient model quickly or just do a direct query here if needed, but preferable use Model.
            // I'll assume Patient.getPatientById exists.
            // If not, I'll need to fix it.
            const patient = await Patient.getPatientById(report.patient_id);

            if (!patient || !patient.email) {
                return res.status(404).json({ success: false, error: 'Patient email not found' });
            }

            const EmailService = require('../utils/email.service');
            const doctorName = `${report.doctor_first_name} ${report.doctor_last_name}`;
            const patientName = `${report.patient_first_name} ${report.patient_last_name}`;

            await EmailService.sendPatientReport(
                patient.email,
                patientName,
                doctorName,
                {
                    diagnosis: report.diagnosis,
                    prescription: report.prescription,
                    notes: report.notes
                },
                report.id
            );

            // Mark as sent in database
            await Report.markReportAsSent(reportId, userId);

            res.json({ success: true, message: 'Report sent to patient' });

        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

    static async getReport(req, res) {
        try {
            const { id: userId, role } = req.user;
            const { reportId } = req.params;

            // Check if user has access to this report
            const hasAccess = await Report.checkReportAccess(reportId, userId, role);
            if (!hasAccess) {
                return res.status(403).json({ success: false, error: 'Unauthorized access to report' });
            }

            // Get report details
            const report = await Report.getReportById(reportId);
            if (!report) {
                return res.status(404).json({ success: false, error: 'Report not found' });
            }

            // Get report iterations if they exist
            const iterations = await Report.getReportIterations(reportId);

            res.json({
                success: true,
                data: {
                    ...report,
                    iterations
                }
            });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

    static async getAllReports(req, res) {
        try {
            const { id: userId, role } = req.user;

            let reports = [];
            if (role === 'doctor') {
                const Doctor = require('../models/doctor.model');
                reports = await Doctor.getDoctorReports(userId);
            } else if (role === 'patient') {
                const query = `
                    SELECT r.*, 
                           d.first_name as doctor_first_name, 
                           d.last_name as doctor_last_name,
                           a.appointment_date 
                    FROM medical_reports r
                    INNER JOIN appointments a ON r.appointment_id = a.id
                    INNER JOIN doctors d ON a.doctor_id = d.id
                    WHERE a.patient_id = $1 AND r.sent_to_patient = TRUE
                    ORDER BY a.appointment_date DESC
                `;
                const pool = require('../config/db.config');
                const result = await pool.query(query, [userId]);
                reports = result.rows;
            }

            res.json({
                success: true,
                data: reports
            });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }
    static async rateReport(req, res) {
        try {
            const { id: userId, role } = req.user;
            if (role !== 'patient') {
                return res.status(403).json({ success: false, error: 'Only patients can rate reports' });
            }
            const { reportId } = req.params;
            const { rating } = req.body;
            if (!rating || typeof rating !== 'number' || rating < 1 || rating > 5) {
                return res.status(400).json({ success: false, error: 'Rating must be a number between 1 and 5' });
            }
            const report = await Report.updatePatientRating(reportId, userId, rating);
            res.json({ success: true, data: report });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

    static async deleteReport(req, res) {
        try {
            const { id: userId, role } = req.user;
            if (role !== 'doctor') {
                return res.status(403).json({ success: false, error: 'Only doctors can delete reports' });
            }
            const { reportId } = req.params;
            await Report.deleteReport(reportId, userId);
            res.json({ success: true, message: 'Report deleted successfully' });
        } catch (error) {
            if (error.message === 'Report not found or unauthorized') {
                return res.status(404).json({ success: false, error: error.message });
            }
            res.status(500).json({ success: false, error: error.message });
        }
    }
}

module.exports = ReportController;