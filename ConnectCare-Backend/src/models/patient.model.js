const pool = require('../config/db.config');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');

class Patient {
    static async createPatient(patientData) {
        try {
            const { email, password, firstName, lastName, phoneNumber, dateOfBirth, gender, bloodGroup, allergies, profileImage } = patientData;

            // Check if email already exists
            const checkEmail = await pool.query('SELECT id FROM patients WHERE email = $1', [email]);
            if (checkEmail.rows.length > 0) {
                throw new Error('Email already registered');
            }

            // Hash password
            const hashedPassword = await bcrypt.hash(password, 10);

            const query = `
                INSERT INTO patients (id, email, password, first_name, last_name, phone_number, date_of_birth, gender, blood_group, allergies, profile_image)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
                RETURNING id, email, first_name, last_name
            `;

            const values = [
                uuidv4(),
                email,
                hashedPassword,
                firstName,
                lastName,
                phoneNumber,
                dateOfBirth,
                gender,
                bloodGroup || null,
                allergies || null,
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
            const query = 'SELECT * FROM patients WHERE email = $1';
            const result = await pool.query(query, [email]);

            if (result.rows.length === 0) {
                throw new Error('Patient not found');
            }

            const patient = result.rows[0];

            if (patient.status === 'inactive') {
                throw new Error('Account is inactive. Please contact administrator.');
            }
            const isValid = await bcrypt.compare(password, patient.password);

            if (!isValid) {
                throw new Error('Invalid password');
            }

            // Return patient data without password
            delete patient.password;
            return patient;
        } catch (error) {
            throw error;
        }
    }

    static async updateProfile(id, updateData) {
        try {
            const allowedFields = ['first_name', 'last_name', 'phone_number', 'blood_group', 'allergies', 'profile_image'];
            const updates = [];
            const values = [id];
            let paramCount = 2;

            // Create a mapping for camelCase to snake_case
            const fieldMapping = {
                firstName: 'first_name',
                lastName: 'last_name',
                phoneNumber: 'phone_number',
                bloodGroup: 'blood_group',
                allergies: 'allergies',
                profileImage: 'profile_image'
            };

            for (const [key, value] of Object.entries(updateData)) {
                const snakeKey = fieldMapping[key] || key;
                if (allowedFields.includes(snakeKey) && value !== undefined) {
                    updates.push(`${snakeKey} = $${paramCount}`);
                    values.push(value);
                    paramCount++;
                }
            }

            if (updates.length === 0) return null;

            const query = `
                UPDATE patients
                SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
                WHERE id = $1
                RETURNING id, first_name, last_name, email, phone_number, date_of_birth, gender, blood_group, allergies, profile_image
            `;

            const result = await pool.query(query, values);
            return result.rows[0];
        } catch (error) {
            throw error;
        }
    }

    static async getPatientById(id) {
        try {
            const query = `
                SELECT id, first_name, last_name, email, phone_number, date_of_birth, 
                       gender, blood_group, allergies, profile_image
                FROM patients 
                WHERE id = $1
            `;
            const result = await pool.query(query, [id]);
            return result.rows[0];
        } catch (error) {
            throw error;
        }
    }

    static async getPatientAppointments(patientId, status = null, date = null) {
        try {
            let query = `
                SELECT a.*, 
                       d.first_name as doctor_first_name, 
                       d.last_name as doctor_last_name,
                       d.specialization as doctor_specialization
                FROM appointments a
                INNER JOIN doctors d ON a.doctor_id = d.id
                WHERE a.patient_id = $1
            `;
            const values = [patientId];
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

    static async bookAppointment(appointmentData) {
        try {
            const { patientId, doctorId, appointmentDate, appointmentTime, appointmentType, reason } = appointmentData;

            // Validate doctorId format
            if (!doctorId || typeof doctorId !== 'string') {
                throw new Error('Invalid doctor ID format');
            }

            // Check if the doctor exists and is active with detailed logging
            console.log('Checking doctor with ID:', doctorId);
            const doctorCheck = await pool.query("SELECT id, first_name, last_name FROM doctors WHERE id = $1 AND status = 'active'", [doctorId]);
            console.log('Doctor check result:', doctorCheck.rows);

            if (doctorCheck.rows.length === 0) {
                throw new Error('Doctor not found or inactive');
            }

            // Validate and parse appointment date
            if (!appointmentDate || !/^\d{4}-\d{2}-\d{2}$/.test(appointmentDate)) {
                throw new Error('Invalid appointment date format. Use YYYY-MM-DD');
            }

            // Validate and parse appointment time
            if (!appointmentTime || !/^\d{2}:\d{2}(:\d{2})?$/.test(appointmentTime)) {
                throw new Error('Invalid appointment time format. Use HH:MM or HH:MM:SS');
            }

            // Validate appointment type
            const validTypes = ['video', 'in-person'];
            const cleanAppointmentType = appointmentType.replace(/enum\(['"](.+)['"]\)/, '$1').replace(/['"]/g, '');
            if (!validTypes.includes(cleanAppointmentType)) {
                throw new Error('Invalid appointment type. Must be "video" or "in-person"');
            }

            // Check for conflicting appointments
            console.log('Checking for conflicts:', { doctorId, appointmentDate, appointmentTime });
            const conflictCheck = await pool.query(
                'SELECT id FROM appointments WHERE doctor_id = $1 AND appointment_date = $2 AND appointment_time = $3 AND status = \'scheduled\'',
                [doctorId, appointmentDate, appointmentTime]
            );
            if (conflictCheck.rows.length > 0) {
                throw new Error('This time slot is already booked');
            }

            const query = `
                INSERT INTO appointments (id, patient_id, doctor_id, appointment_date, appointment_time, appointment_type, reason)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
                RETURNING *
            `;

            const values = [
                uuidv4(),
                patientId,
                doctorId,
                appointmentDate,
                appointmentTime,
                cleanAppointmentType,
                reason
            ];

            const result = await pool.query(query, values);
            return result.rows[0];
        } catch (error) {
            throw error;
        }
    }
}

module.exports = Patient;