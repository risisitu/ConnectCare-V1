const pool = require('../config/db.config');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');

class Doctor {
    static async getAllDoctors() {
        try {
            const query = "SELECT id, first_name, last_name, specialization, experience_years, clinic_address, profile_image FROM doctors WHERE status = 'active'";
            const result = await pool.query(query);
            return result.rows;
        } catch (error) {
            throw error;
        }
    }

    static async getDoctorById(id) {
        try {
            const query = 'SELECT id, first_name, last_name, email, phone_number, specialization, experience_years, clinic_address, profile_image FROM doctors WHERE id = $1';
            const result = await pool.query(query, [id]);
            return result.rows[0];
        } catch (error) {
            throw error;
        }
    }

    static async createDoctor(doctorData) {
        try {
            const { email, password, firstName, lastName, phoneNumber, specialization, licenseNumber, experienceYears, clinicAddress, profileImage } = doctorData;

            // Check if email already exists
            const checkEmail = await pool.query('SELECT id FROM doctors WHERE email = $1', [email]);
            if (checkEmail.rows.length > 0) {
                throw new Error('Email already registered');
            }

            // Hash password
            const hashedPassword = await bcrypt.hash(password, 10);

            const query = `
                INSERT INTO doctors (id, email, password, first_name, last_name, phone_number, specialization, license_number, experience_years, clinic_address, profile_image)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
                RETURNING id, email, first_name, last_name, specialization
            `;

            const values = [
                uuidv4(),
                email,
                hashedPassword,
                firstName,
                lastName,
                phoneNumber,
                specialization,
                licenseNumber,
                experienceYears,
                clinicAddress,
                profileImage || null
            ];

            const result = await pool.query(query, values);
            return result.rows[0];
        } catch (error) {
            throw error;
        }
    }

    static async login(email, password) {
        try {
            const query = 'SELECT * FROM doctors WHERE email = $1';
            const result = await pool.query(query, [email]);

            if (result.rows.length === 0) {
                throw new Error('Doctor not found');
            }

            const doctor = result.rows[0];

            if (doctor.status === 'inactive') {
                throw new Error('Account is inactive. Please contact administrator.');
            }
            const isValid = await bcrypt.compare(password, doctor.password);

            if (!isValid) {
                throw new Error('Invalid password');
            }

            // Return doctor data without password
            delete doctor.password;
            return doctor;
        } catch (error) {
            throw error;
        }
    }

    static async updateProfile(id, updateData) {
        try {
            const allowedFields = ['first_name', 'last_name', 'phone_number', 'specialization', 'clinic_address', 'profile_image', 'experience_years'];
            const updates = [];
            const values = [id];
            let paramCount = 2;

            for (const [key, value] of Object.entries(updateData)) {
                const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
                if (allowedFields.includes(snakeKey) && value !== undefined) {
                    updates.push(`${snakeKey} = $${paramCount}`);
                    values.push(value);
                    paramCount++;
                }
            }

            if (updates.length === 0) return null;

            const query = `
                UPDATE doctors
                SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
                WHERE id = $1
                RETURNING id, first_name, last_name, email, phone_number, specialization, clinic_address, profile_image
            `;

            const result = await pool.query(query, values);
            return result.rows[0];
        } catch (error) {
            throw error;
        }
    }

    static async getDoctorPatients(doctorId) {
        try {
            const query = `
                SELECT DISTINCT ON (p.id) 
                    p.id, 
                    p.first_name, 
                    p.last_name, 
                    p.email, 
                    p.phone_number, 
                    p.gender, 
                    p.date_of_birth, 
                    p.status,
                    a.reason as last_appointment_reason
                FROM patients p
                INNER JOIN appointments a ON p.id = a.patient_id
                WHERE a.doctor_id = $1
                ORDER BY p.id, a.appointment_date DESC, a.appointment_time DESC
            `;
            const result = await pool.query(query, [doctorId]);
            return result.rows;
        } catch (error) {
            throw error;
        }
    }

    static async getPatientById(doctorId, patientId) {
        try {
            const query = `
                SELECT DISTINCT 
                    p.id, 
                    p.first_name, 
                    p.last_name, 
                    p.email, 
                    p.phone_number, 
                    p.gender, 
                    p.date_of_birth, 
                    p.blood_group, 
                    p.allergies
                FROM patients p
                INNER JOIN appointments a ON p.id = a.patient_id
                WHERE a.doctor_id = $1 AND p.id = $2
            `;
            const result = await pool.query(query, [doctorId, patientId]);
            return result.rows[0];
        } catch (error) {
            throw error;
        }
    }

    static async getDoctorAppointments(doctorId, status = null, date = null) {
        try {
            let query = `
                SELECT a.*, 
                       p.first_name as patient_first_name, 
                       p.last_name as patient_last_name
                FROM appointments a
                INNER JOIN patients p ON a.patient_id = p.id
                WHERE a.doctor_id = $1
            `;
            const values = [doctorId];
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

    static async getDoctorReports(doctorId, status = null, date = null) {
        try {
            let query = `
                SELECT r.*, 
                       p.first_name as patient_first_name, 
                       p.last_name as patient_last_name,
                       a.appointment_date,
                       a.appointment_type
                FROM medical_reports r
                INNER JOIN appointments a ON r.appointment_id = a.id
                INNER JOIN patients p ON a.patient_id = p.id
                WHERE a.doctor_id = $1
            `;
            const values = [doctorId];
            let paramCount = 2;

            if (status) {
                query += ` AND r.status = $${paramCount}`;
                values.push(status);
                paramCount++;
            }

            if (date) {
                query += ` AND DATE(a.appointment_date) = $${paramCount}`;
                values.push(date);
            }

            query += ' ORDER BY a.appointment_date DESC';

            const result = await pool.query(query, values);
            return result.rows;
        } catch (error) {
            throw error;
        }
    }

    static async updateReportStatus(doctorId, reportId, status, notes) {
        try {
            const query = `
                UPDATE medical_reports r
                SET status = $1,
                    notes = $2,
                    updated_at = CURRENT_TIMESTAMP
                FROM appointments a
                WHERE r.appointment_id = a.id
                AND r.id = $3
                AND a.doctor_id = $4
                RETURNING r.*, 
                          a.appointment_date,
                          a.appointment_type
            `;

            const result = await pool.query(query, [status, notes, reportId, doctorId]);
            return result.rows[0];
        } catch (error) {
            throw error;
        }
    }
    static async getDoctorStats(doctorId) {
        try {
            // Get doctor settings
            const settingsResult = await pool.query(
                'SELECT monthly_target, daily_capacity, avg_consultation_time FROM doctors WHERE id = $1',
                [doctorId]
            );
            const settings = settingsResult.rows[0] || { monthly_target: 100, daily_capacity: 12, avg_consultation_time: 15 };

            // Get average patient satisfaction rating from medical reports
            const ratingResult = await pool.query(
                'SELECT ROUND(AVG(patient_rating)::numeric, 1) as avg_rating, COUNT(patient_rating) as rating_count FROM medical_reports WHERE doctor_id = $1 AND patient_rating IS NOT NULL',
                [doctorId]
            );
            const avgRating = ratingResult.rows[0]?.avg_rating || null;
            const ratingCount = ratingResult.rows[0]?.rating_count || 0;

            return { ...settings, avg_rating: avgRating, rating_count: ratingCount };
        } catch (error) {
            throw error;
        }
    }

    static async updateDoctorSettings(doctorId, settings) {
        try {
            const { monthly_target, daily_capacity, avg_consultation_time } = settings;
            const query = `
                UPDATE doctors
                SET monthly_target = COALESCE($1, monthly_target),
                    daily_capacity = COALESCE($2, daily_capacity),
                    avg_consultation_time = COALESCE($3, avg_consultation_time),
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = $4
                RETURNING monthly_target, daily_capacity, avg_consultation_time
            `;
            const result = await pool.query(query, [monthly_target, daily_capacity, avg_consultation_time, doctorId]);
            return result.rows[0];
        } catch (error) {
            throw error;
        }
    }

    static async getLatestBookingNotifications(doctorId) {
        try {
            const query = `
                SELECT a.id, a.appointment_date, a.appointment_time, a.created_at,
                       p.first_name, p.last_name
                FROM appointments a
                INNER JOIN patients p ON a.patient_id = p.id
                WHERE a.doctor_id = $1 AND a.status = 'scheduled'
                ORDER BY a.created_at DESC
                LIMIT 10
            `;
            const result = await pool.query(query, [doctorId]);
            return result.rows;
        } catch (error) {
            throw error;
        }
    }

    static async getPatientHistory(doctorId, patientId) {
        try {
            const query = `
                SELECT a.*, 
                       r.id as report_id,
                       r.status as report_status,
                       r.ai_generated as is_ai_report
                FROM appointments a
                LEFT JOIN medical_reports r ON a.id = r.appointment_id
                WHERE a.doctor_id = $1 AND a.patient_id = $2
                ORDER BY a.appointment_date DESC, a.appointment_time DESC
            `;
            const result = await pool.query(query, [doctorId, patientId]);
            return result.rows;
        } catch (error) {
            throw error;
        }
    }
}

module.exports = Doctor;