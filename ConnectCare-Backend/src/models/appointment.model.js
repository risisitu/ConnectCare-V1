const pool = require('../config/db.config');
const { v4: uuidv4 } = require('uuid');

class Appointment {
    static async createAppointment(appointmentData) {
        try {
            const { patientId, doctorId, appointmentDate, appointmentTime, appointmentType, reason } = appointmentData;

            // Check if the doctor exists
            const doctorCheck = await pool.query('SELECT id FROM doctors WHERE id = $1', [doctorId]);
            if (doctorCheck.rows.length === 0) {
                throw new Error('Doctor not found');
            }

            // Check for conflicting appointments
            const conflictCheck = await pool.query(
                'SELECT id FROM appointments WHERE doctor_id = $1 AND appointment_date = $2 AND appointment_time = $3 AND status = \'scheduled\'',
                [doctorId, appointmentDate, appointmentTime]
            );
            if (conflictCheck.rows.length > 0) {
                throw new Error('This time slot is already booked');
            }

            const query = `
                INSERT INTO appointments (
                    id, 
                    patient_id, 
                    doctor_id, 
                    appointment_date, 
                    appointment_time, 
                    appointment_type, 
                    reason,
                    status
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7, 'scheduled')
                RETURNING *
            `;

            const values = [
                uuidv4(),
                patientId,
                doctorId,
                appointmentDate,
                appointmentTime,
                appointmentType,
                reason
            ];

            const result = await pool.query(query, values);
            return result.rows[0];
        } catch (error) {
            throw error;
        }
    }

    static async getAppointments(userId, role, status = null, date = null) {
        try {
            let query = `
                SELECT a.*, 
                       d.first_name as doctor_first_name,
                       d.last_name as doctor_last_name,
                       d.specialization as doctor_specialization,
                       p.first_name as patient_first_name,
                       p.last_name as patient_last_name
                FROM appointments a
                INNER JOIN doctors d ON a.doctor_id = d.id
                INNER JOIN patients p ON a.patient_id = p.id
                WHERE a.${role}_id = $1
            `;
            
            const values = [userId];
            let paramCount = 2;

            if (status) {
                query += ` AND a.status = $${paramCount}`;
                values.push(status);
                paramCount++;
            }

            if (date) {
                query += ` AND DATE(a.appointment_date) = $${paramCount}`;
                values.push(date);
            }

            query += ' ORDER BY a.appointment_date, a.appointment_time';

            const result = await pool.query(query, values);
            return result.rows;
        } catch (error) {
            throw error;
        }
    }

    static async generateVideoCallLink(appointmentId) {
        try {
            // In a real application, this would integrate with a video call service
            // For now, we'll generate a mock link
            const videoCallLink = `https://meet.connectcare.com/${appointmentId}`;
            
            const query = `
                UPDATE appointments 
                SET video_call_link = $1
                WHERE id = $2 AND appointment_type = 'video'
                RETURNING *
            `;
            
            const result = await pool.query(query, [videoCallLink, appointmentId]);
            return result.rows[0];
        } catch (error) {
            throw error;
        }
    }

    static async updateAppointmentStatus(appointmentId, status, userId, userRole) {
        try {
            let query = `
                UPDATE appointments 
                SET status = $1
                WHERE id = $2 AND ${userRole}_id = $3
                RETURNING *
            `;
            
            const result = await pool.query(query, [status, appointmentId, userId]);
            if (result.rows.length === 0) {
                throw new Error('Appointment not found or unauthorized');
            }
            return result.rows[0];
        } catch (error) {
            throw error;
        }
    }

    static async getAppointmentById(appointmentId) {
        try {
            const query = `
                SELECT a.*, 
                       d.first_name as doctor_first_name,
                       d.last_name as doctor_last_name,
                       d.specialization as doctor_specialization,
                       p.first_name as patient_first_name,
                       p.last_name as patient_last_name
                FROM appointments a
                INNER JOIN doctors d ON a.doctor_id = d.id
                INNER JOIN patients p ON a.patient_id = p.id
                WHERE a.id = $1
            `;
            
            const result = await pool.query(query, [appointmentId]);
            return result.rows[0];
        } catch (error) {
            throw error;
        }
    }

    static async checkAppointmentAccess(appointmentId, userId, userRole) {
        try {
            const query = `
                SELECT id FROM appointments 
                WHERE id = $1 AND ${userRole}_id = $2
            `;
            
            const result = await pool.query(query, [appointmentId, userId]);
            return result.rows.length > 0;
        } catch (error) {
            throw error;
        }
    }
}

module.exports = Appointment;