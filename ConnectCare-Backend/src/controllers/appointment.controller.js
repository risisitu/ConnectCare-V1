
const Appointment = require('../models/appointment.model');
const otpService = require('../utils/otp.service');
const emailService = require('../utils/email.service');

class AppointmentController {
    static async createAppointment(req, res) {
        console.log('Received appointment creation request');
        console.log('Request URL:', req.url);
        console.log('Request method:', req.method);
        console.log('Request headers:', req.headers);
        console.log('Request body:', req.body);

        try {
            // First verify database connection
            const pool = require('../config/db.config');
            try {
                await pool.query('SELECT NOW()');
            } catch (dbError) {
                console.error('Database connection error:', dbError);
                return res.status(500).json({
                    success: false,
                    error: 'Database connection error',
                    details: dbError.message
                });
            }

            const { id: userId, role } = req.user;
            console.log('User info from token:', { userId, role });

            if (role !== 'patient') {
                return res.status(403).json({
                    success: false,
                    error: 'Only patients can create appointments'
                });
            }

            const appointmentData = {
                ...req.body,
                patientId: userId
            };

            const appointment = await Appointment.createAppointment(appointmentData);

            // Fetch doctor email and name
            let doctor;
            try {
                const doctorResult = await pool.query(
                    'SELECT email, first_name, last_name FROM doctors WHERE id = $1',
                    [appointment.doctor_id || appointment.doctorId || req.body.doctorId]
                );
                doctor = doctorResult.rows[0];
            } catch (e) {
                doctor = null;
            }

            // Fetch patient info (name, email, phone, dob)
            let patient;
            try {
                const patientResult = await pool.query(
                    'SELECT first_name, last_name, email, phone_number, date_of_birth FROM patients WHERE id = $1',
                    [appointment.patient_id || appointment.patientId || userId]
                );
                patient = patientResult.rows[0];
            } catch (e) {
                patient = null;
            }

            // Send email to doctor (book appointment notification)
            if (doctor && doctor.email) {
                const subject = 'New Appointment Request';
                const text = `Dear Dr. ${doctor.last_name || ''},\n\nA new appointment has been requested by ${patient ? (patient.first_name + ' ' + patient.last_name) : 'a patient'}.\n\nDate: ${appointment.appointment_date || appointment.appointmentDate || req.body.appointmentDate}\nTime: ${appointment.appointment_time || appointment.appointmentTime || req.body.appointmentTime}\nType: ${appointment.appointment_type || appointment.appointmentType || req.body.appointmentType}\nReason: ${appointment.reason || req.body.reason}\n\nPlease log in to ConnectCare to view more details.`;
                // Modern HTML layout inspired by the provided React interface
                const html = `<!DOCTYPE html><html><head><meta charset='UTF-8'><title>New Appointment Request</title></head><body style='background:#f3f4f6;margin:0;padding:0;font-family:sans-serif;'>
<div style='max-width:700px;margin:40px auto;background:#fff;border-radius:12px;box-shadow:0 2px 12px #0002;overflow:hidden;'>
    <div style='background:#2563eb;color:#fff;padding:28px 24px 18px 24px;display:flex;align-items:center;justify-content:space-between;'>
        <div style='display:flex;align-items:center;gap:12px;'>
            <span style="display:inline-block;background:#fff2;border-radius:50%;padding:8px;"><svg width='24' height='24' fill='none' stroke='#fff' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='M4 4h16v16H4z'/><path d='M22 6l-10 7L2 6'/></svg></span>
            <span style='font-size:1.2rem;font-weight:600;'>Dr. ${doctor.last_name || ''} - Inbox</span>
        </div>
        <div style='font-size:0.95rem;background:#1e40af;padding:6px 18px;border-radius:999px;'>ConnectCare</div>
    </div>
    <div style='padding:32px 24px 0 24px;'>
        <div style='margin-bottom:18px;'>
            <span style='background:#fef3c7;color:#b45309;padding:4px 10px;border-radius:6px;font-size:0.85rem;font-weight:500;margin-right:8px;'>New Appointment Request</span>
            <span style='background:#fee2e2;color:#b91c1c;padding:4px 10px;border-radius:6px;font-size:0.85rem;font-weight:500;'>${appointment.reason && appointment.reason.toLowerCase().includes('urgent') ? 'Urgent' : 'Normal'}</span>
        </div>
        <h2 style='font-size:1.5rem;font-weight:700;color:#1e293b;margin-bottom:18px;'>Appointment Request - ${appointment.appointment_type ? appointment.appointment_type.charAt(0).toUpperCase() + appointment.appointment_type.slice(1) : 'Consultation'}</h2>
        <div style='background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:18px 20px;margin-bottom:28px;display:flex;align-items:center;gap:18px;'>
            <div style='width:48px;height:48px;background:#2563eb;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#fff;font-size:1.3rem;font-weight:600;'>
                ${(patient && patient.first_name && patient.last_name) ? (patient.first_name[0] + patient.last_name[0]) : 'PT'}
            </div>
            <div style='flex:1;'>
                <div style='font-weight:600;color:#1e293b;'>${patient ? (patient.first_name + ' ' + patient.last_name) : 'Patient'}</div>
                <div style='font-size:0.97rem;color:#475569;'>${patient ? patient.email || '' : ''}</div>
                <div style='font-size:0.85rem;color:#64748b;margin-top:2px;'>Patient ID: ${appointment.patient_id || appointment.patientId || userId}</div>
            </div>
            <div style='text-align:right;font-size:0.97rem;color:#64748b;'>${new Date().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}</div>
        </div>
        <div style='margin-bottom:28px;'>
            <p style='color:#334155;margin-bottom:12px;'>Dear Dr. ${doctor.last_name || ''},</p>
            <p style='color:#334155;margin-bottom:12px;'>A new appointment has been requested by <strong>${patient ? (patient.first_name + ' ' + patient.last_name) : 'a patient'}</strong>.</p>
            <table style='width:100%;margin-bottom:18px;font-size:1rem;color:#334155;'>
                <tr><td style='padding:6px 0;width:120px;'><strong>Date:</strong></td><td style='padding:6px 0;'>${appointment.appointment_date || appointment.appointmentDate || req.body.appointmentDate}</td></tr>
                <tr><td style='padding:6px 0;'><strong>Time:</strong></td><td style='padding:6px 0;'>${appointment.appointment_time || appointment.appointmentTime || req.body.appointmentTime}</td></tr>
                <tr><td style='padding:6px 0;'><strong>Type:</strong></td><td style='padding:6px 0;'>${appointment.appointment_type || appointment.appointmentType || req.body.appointmentType}</td></tr>
                <tr><td style='padding:6px 0;'><strong>Reason:</strong></td><td style='padding:6px 0;'>${appointment.reason || req.body.reason}</td></tr>
            </table>
            <p style='color:#334155;margin-bottom:12px;'>Please log in to <a href='https://connectcare.com' style='color:#2563eb;text-decoration:none;'>ConnectCare</a> to view more details or respond to this request.</p>
        </div>
        <div style='background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:18px 20px;margin-bottom:24px;'>
            <h3 style='font-weight:600;color:#1e293b;margin-bottom:10px;'>Patient Information</h3>
            <div style='display:flex;flex-wrap:wrap;gap:24px;'>
                <div style='min-width:180px;'>
                    <div style='font-size:0.95rem;color:#64748b;'>Phone</div>
                    <div style='color:#1e293b;font-weight:500;'>${patient && patient.phone_number ? patient.phone_number : 'N/A'}</div>
                </div>
                <div style='min-width:180px;'>
                    <div style='font-size:0.95rem;color:#64748b;'>Date of Birth</div>
                    <div style='color:#1e293b;font-weight:500;'>${patient && patient.date_of_birth ? patient.date_of_birth : 'N/A'}</div>
                </div>
            </div>
        </div>
        <div style='border-top:1px solid #e5e7eb;padding-top:18px;margin-top:18px;'>
            <div style='font-size:0.97rem;color:#64748b;'>This is an automated message from ConnectCare. Please do not reply.</div>
        </div>
    </div>
</div>
</body></html>`;
                await otpService.sendGenericEmail(doctor.email, subject, text, html);
            }

            // Create In-App Notification for Doctor
            const NotificationService = require('../services/notification.service');
            await NotificationService.createInAppNotification(
                appointment.doctor_id || appointment.doctorId || req.body.doctorId,
                'New Appointment Booking',
                `${patient ? (patient.first_name + ' ' + patient.last_name) : 'A patient'} has booked a new ${appointment.appointment_type || 'consultation'} appointment.`,
                'booking'
            );

            // Create In-App Notification for Patient
            await NotificationService.createInAppNotification(
                userId,
                'Appointment Confirmed',
                `Your ${appointment.appointment_type || 'consultation'} appointment with Dr. ${doctor ? doctor.last_name : 'the doctor'} has been confirmed.`,
                'booking'
            );

            res.status(201).json({
                success: true,
                data: appointment
            });
        } catch (error) {
            console.error('Error in createAppointment:', error);
            if (error.message === 'Doctor not found' || error.message === 'This time slot is already booked') {
                return res.status(400).json({ success: false, error: error.message });
            }
            res.status(500).json({ success: false, error: error.message });
        }
    }

    static async getAppointments(req, res) {
        try {
            const { id: userId, role } = req.user;
            const { status, date } = req.query;

            const appointments = await Appointment.getAppointments(userId, role, status, date);
            res.json({
                success: true,
                data: appointments
            });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

    static async generateVideoCallLink(req, res) {
        try {
            const { id: userId, role } = req.user;
            const { appointmentId } = req.params;

            // Check if user has access to this appointment
            const hasAccess = await Appointment.checkAppointmentAccess(appointmentId, userId, role);
            if (!hasAccess) {
                return res.status(403).json({ success: false, error: 'Unauthorized access to appointment' });
            }

            const appointment = await Appointment.generateVideoCallLink(appointmentId);
            if (!appointment) {
                return res.status(404).json({ success: false, error: 'Appointment not found or not a video appointment' });
            }

            res.json({
                success: true,
                data: {
                    appointmentId: appointment.id,
                    videoCallLink: appointment.video_call_link
                }
            });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

    static async updateAppointmentStatus(req, res) {
        try {
            const { id: userId, role } = req.user;
            const { appointmentId } = req.params;
            const { status } = req.body;

            // Validate status
            const validStatuses = ['completed', 'cancelled'];
            if (!validStatuses.includes(status)) {
                return res.status(400).json({ success: false, error: 'Invalid status' });
            }

            const appointment = await Appointment.updateAppointmentStatus(appointmentId, status, userId, role);
            res.json({
                success: true,
                data: appointment
            });
        } catch (error) {
            if (error.message === 'Appointment not found or unauthorized') {
                return res.status(403).json({ success: false, error: error.message });
            }
            res.status(500).json({ success: false, error: error.message });
        }
    }

    static async getAppointmentById(req, res) {
        try {
            const { id: userId, role } = req.user;
            const { appointmentId } = req.params;

            // Check if user has access to this appointment
            const hasAccess = await Appointment.checkAppointmentAccess(appointmentId, userId, role);
            if (!hasAccess) {
                return res.status(403).json({ success: false, error: 'Unauthorized access to appointment' });
            }

            const appointment = await Appointment.getAppointmentById(appointmentId);
            if (!appointment) {
                return res.status(404).json({ success: false, error: 'Appointment not found' });
            }

            res.json({
                success: true,
                data: appointment
            });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }
    static async sendVideoCallInvite(req, res) {
        try {
            const { id: userId, role } = req.user;
            const { appointmentId, doctorId, patientId, doctorName, patientName, link } = req.body;

            // Simple validation
            if (!link) {
                return res.status(400).json({ success: false, error: 'Video call link is required' });
            }

            if (!appointmentId) {
                return res.status(400).json({ success: false, error: 'Appointment ID is required' });
            }

            // Fetch appointment details and validate
            const appointmentDetails = await Appointment.getAppointmentById(appointmentId);
            if (!appointmentDetails) {
                return res.status(404).json({ success: false, error: 'Appointment not found' });
            }

            // Check if already completed
            if (appointmentDetails.status === 'completed') {
                return res.status(400).json({ success: false, error: 'Cannot engage in a call for a completed appointment' });
            }

            // Check if past date
            const now = new Date();
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            const appDate = new Date(appointmentDetails.appointment_date);
            const appDateOnly = new Date(appDate.getFullYear(), appDate.getMonth(), appDate.getDate());

            if (appDateOnly < today) {
                return res.status(400).json({ success: false, error: 'Cannot engage in a call for a past appointment' });
            }

            // If sender is patient, we notify doctor
            // If sender is doctor, we notify patient
            // But based on request, "When a patient select the call button, it should send api to doctor"

            // We need target email. 
            // If passed explicitly, great. If not, we might need to fetch it.
            // For simplicity/speed, let's assume we fetch if ID is provided, or rely on passed "targetEmail" if we want to be flexible.
            // But usually we should fetch from DB for security.

            const pool = require('../config/db.config');

            let targetEmail = '';
            let targetName = doctorName || 'Doctor';
            let senderName = patientName || 'Patient';

            if (role === 'patient') {
                // Sender is patient, target is doctor
                if (!doctorId) {
                    return res.status(400).json({ success: false, error: 'Doctor ID is required' });
                }
                const result = await pool.query('SELECT email, first_name, last_name FROM doctors WHERE id = $1', [doctorId]);
                if (result.rows.length === 0) {
                    return res.status(404).json({ success: false, error: 'Doctor not found' });
                }
                const doctor = result.rows[0];
                targetEmail = doctor.email;
                targetName = `Dr. ${doctor.last_name || doctor.first_name}`;

                // Get patient name if not provided
                if (!patientName) {
                    const pResult = await pool.query('SELECT first_name, last_name FROM patients WHERE id = $1', [userId]);
                    if (pResult.rows.length > 0) {
                        senderName = `${pResult.rows[0].first_name} ${pResult.rows[0].last_name}`;
                    }
                }
            } else if (role === 'doctor') {
                // Sender is doctor, target is patient (optional bonus)
                if (!patientId) {
                    return res.status(400).json({ success: false, error: 'Patient ID is required' });
                }
                const result = await pool.query('SELECT email, first_name, last_name FROM patients WHERE id = $1', [patientId]);
                if (result.rows.length === 0) {
                    return res.status(404).json({ success: false, error: 'Patient not found' });
                }
                const patient = result.rows[0];
                targetEmail = patient.email;
                targetName = `${patient.first_name} ${patient.last_name}`;

                // Get doctor name if not provided
                if (!doctorName) {
                    const dResult = await pool.query('SELECT first_name, last_name FROM doctors WHERE id = $1', [userId]);
                    if (dResult.rows.length > 0) {
                        senderName = `Dr. ${dResult.rows[0].last_name || dResult.rows[0].first_name}`;
                    }
                }
            }

            if (!targetEmail) {
                return res.status(400).json({ success: false, error: 'Could not determine target email' });
            }

            const emailSent = await emailService.sendVideoCallEmail(targetEmail, targetName, senderName, link);

            if (emailSent) {
                res.json({ success: true, message: 'Invite sent successfully' });
            } else {
                res.status(500).json({ success: false, error: 'Failed to send email' });
            }

        } catch (error) {
            console.error('Send invite error:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    }
}

module.exports = AppointmentController;