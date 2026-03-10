const jwt = require('jsonwebtoken');
const pool = require('../config/db.config');
const Appointment = require('../models/appointment.model');
const emailService = require('../utils/email.service');
const NotificationService = require('../services/notification.service');
const AuditLog = require('../models/audit_log.model');

class AdminController {
    static async login(req, res) {
        try {
            const { email, password } = req.body;

            // Hardcoded admin credentials
            const ADMIN_EMAIL = 'connectcarea@gmail.com';
            const ADMIN_PASSWORD = '35hWi45!';

            if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
                // Generate JWT token
                const token = jwt.sign(
                    { id: 'admin-1', email: ADMIN_EMAIL, role: 'admin' },
                    process.env.JWT_SECRET,
                    { expiresIn: '24h' }
                );

                return res.json({
                    success: true,
                    data: {
                        id: 'admin-1',
                        email: ADMIN_EMAIL,
                        role: 'admin',
                        token
                    }
                });
            }

            return res.status(401).json({ success: false, error: 'Invalid credentials' });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

    static async getAllUsers(req, res) {
        try {
            const doctorsResult = await pool.query('SELECT id, first_name, last_name, email, phone_number, specialization, status, created_at FROM doctors ORDER BY created_at DESC');
            const patientsResult = await pool.query('SELECT id, first_name, last_name, email, phone_number, gender, status, created_at FROM patients ORDER BY created_at DESC');

            return res.json({
                success: true,
                data: {
                    doctors: doctorsResult.rows,
                    patients: patientsResult.rows
                }
            });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

    static async updateUserStatus(req, res) {
        try {
            const adminId = req.user?.id || 'admin-1';
            const adminEmail = req.user?.email || 'connectcarea@gmail.com';
            const { type, id } = req.params;
            const { status } = req.body;

            if (!['active', 'inactive'].includes(status)) {
                return res.status(400).json({ success: false, error: 'Invalid status' });
            }

            let query = '';
            if (type === 'doctor') {
                query = 'UPDATE doctors SET status = $1 WHERE id = $2 RETURNING id, status, first_name, last_name';
            } else if (type === 'patient') {
                query = 'UPDATE patients SET status = $1 WHERE id = $2 RETURNING id, status, first_name, last_name';
            } else {
                return res.status(400).json({ success: false, error: 'Invalid user type' });
            }

            const result = await pool.query(query, [status, id]);

            if (result.rows.length === 0) {
                return res.status(404).json({ success: false, error: 'User not found' });
            }

            // Create Audit Log
            try {
                const targetName = result.rows[0].first_name ? `${type === 'doctor' ? 'Dr. ' : ''}${result.rows[0].first_name} ${result.rows[0].last_name}` : 'Unknown';
                await AuditLog.createLog({
                    adminId,
                    adminName: 'Administrator', // In a full system, you might fetch real admin name
                    actionType: status === 'active' ? 'activation' : 'deactivation',
                    targetName,
                    targetRole: type,
                    details: `${type.charAt(0).toUpperCase() + type.slice(1)} ${targetName} was ${status === 'active' ? 'activated' : 'deactivated'}.`
                });
            } catch (auditError) {
                console.error('Failed to create audit log for status update:', auditError);
            }

            return res.json({
                success: true,
                data: result.rows[0]
            });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

    static async getAllConsultations(req, res) {
        try {
            const appointments = await Appointment.getAllAppointmentsAdmin();
            return res.json({
                success: true,
                data: appointments
            });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

    static async cancelConsultation(req, res) {
        try {
            const adminId = req.user?.id || 'admin-1';
            const { id } = req.params;

            // Validate that we have the appointment
            const appointment = await Appointment.getAppointmentById(id);
            if (!appointment) {
                return res.status(404).json({ success: false, error: 'Appointment not found' });
            }

            // Update status
            const updatedAppointment = await Appointment.updateAppointmentStatusAdmin(id, 'cancelled');

            // Send Notifications
            try {
                // To Patient
                await NotificationService.createInAppNotification(
                    appointment.patient_id,
                    'Consultation Cancelled',
                    `Your consultation with Dr.${appointment.doctor_last_name} has been cancelled by the Administrator.`,
                    'cancellation'
                );

                // To Doctor
                await NotificationService.createInAppNotification(
                    appointment.doctor_id,
                    'Consultation Cancelled',
                    `Your consultation with ${appointment.patient_first_name} ${appointment.patient_last_name} has been cancelled by the Administrator.`,
                    'cancellation'
                );

                // Send Emails
                if (appointment.patient_email) {
                    await emailService.sendAdminCancellationEmail(
                        appointment.patient_email,
                        `${appointment.patient_first_name} ${appointment.patient_last_name} `,
                        'Patient',
                        appointment.appointment_date,
                        appointment.appointment_time,
                        appointment.reason
                    );
                }

                if (appointment.doctor_email) {
                    await emailService.sendAdminCancellationEmail(
                        appointment.doctor_email,
                        `Dr.${appointment.doctor_last_name} `,
                        'Doctor',
                        appointment.appointment_date,
                        appointment.appointment_time,
                        appointment.reason
                    );
                }
            } catch (notifyError) {
                console.error('Failed to send admin cancellation notifications:', notifyError);
            }

            // Create Audit Log
            try {
                const formattedDate = new Date(appointment.appointment_date).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });
                const formattedTime = appointment.appointment_time; // usually HH:MM:SS from db
                await AuditLog.createLog({
                    adminId,
                    adminName: 'Administrator',
                    actionType: 'cancellation',
                    targetName: `Dr. ${appointment.doctor_last_name} and ${appointment.patient_first_name}`,
                    targetRole: 'consultation',
                    details: `Administrator cancelled consultation scheduled for ${formattedDate} at ${formattedTime} between Dr. ${appointment.doctor_last_name} and ${appointment.patient_first_name}.`
                });
            } catch (auditError) {
                console.error('Failed to create audit log for consultation cancellation:', auditError);
            }

            return res.json({
                success: true,
                data: updatedAppointment,
                message: 'Consultation cancelled successfully'
            });

        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }
    static async getAuditLogs(req, res) {
        try {
            const logs = await AuditLog.getAllLogs();
            return res.json({
                success: true,
                data: logs
            });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

    static async getDashboardStats(req, res) {
        try {
            const [totalPatients, totalDoctors, activeToday, completedMonth] = await Promise.all([
                pool.query('SELECT COUNT(*) FROM patients'),
                pool.query('SELECT COUNT(*) FROM doctors'),
                pool.query(`SELECT COUNT(*) FROM appointments WHERE status = 'scheduled' AND appointment_date = CURRENT_DATE`),
                pool.query(`SELECT COUNT(*) FROM appointments WHERE status = 'completed' AND appointment_date >= date_trunc('month', CURRENT_DATE)`)
            ]);

            return res.json({
                success: true,
                data: {
                    totalPatients: parseInt(totalPatients.rows[0].count),
                    totalDoctors: parseInt(totalDoctors.rows[0].count),
                    activeConsultationsToday: parseInt(activeToday.rows[0].count),
                    completedConsultationsThisMonth: parseInt(completedMonth.rows[0].count)
                }
            });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }
}

module.exports = AdminController;
