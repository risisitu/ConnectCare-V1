const pool = require('../config/db.config');
const { v4: uuidv4 } = require('uuid');

class Report {
    static async createReport(reportData) {
        try {
            const { appointmentId, patientId, doctorId, diagnosis, prescription, notes, aiGenerated, generationTimeSeconds } = reportData;

            const query = `
                INSERT INTO medical_reports (
                    id, appointment_id, patient_id, doctor_id, diagnosis, 
                    prescription, notes, ai_generated, sent_to_patient, generation_time_seconds
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                RETURNING *
            `;

            const values = [
                uuidv4(),
                appointmentId,
                patientId,
                doctorId,
                diagnosis,
                prescription,
                notes,
                aiGenerated || false,
                false,
                generationTimeSeconds || null
            ];

            const result = await pool.query(query, values);
            return result.rows[0];
        } catch (error) {
            throw error;
        }
    }

    static async updateReportStatus(reportId, status, doctorId) {
        try {
            const query = `
                UPDATE medical_reports
                SET status = $1, updated_at = CURRENT_TIMESTAMP
                WHERE id = $2 AND doctor_id = $3
                RETURNING *
            `;

            const result = await pool.query(query, [status, reportId, doctorId]);
            if (result.rows.length === 0) {
                throw new Error('Report not found or unauthorized');
            }
            return result.rows[0];
        } catch (error) {
            throw error;
        }
    }

    static async updateReportContent(reportId, content, doctorId) {
        try {
            const { diagnosis, prescription, notes } = content;
            const query = `
                UPDATE medical_reports
                SET diagnosis = $1, prescription = $2, notes = $3, updated_at = CURRENT_TIMESTAMP
                WHERE id = $4 AND doctor_id = $5
                RETURNING *
            `;

            const result = await pool.query(query, [diagnosis, prescription, notes, reportId, doctorId]);
            if (result.rows.length === 0) {
                throw new Error('Report not found or unauthorized');
            }
            return result.rows[0];
        } catch (error) {
            throw error;
        }
    }

    static async getReportById(reportId) {
        try {
            const query = `
                SELECT r.*, 
                       d.first_name as doctor_first_name,
                       d.last_name as doctor_last_name,
                       p.first_name as patient_first_name,
                       p.last_name as patient_last_name
                FROM medical_reports r
                INNER JOIN doctors d ON r.doctor_id = d.id
                INNER JOIN patients p ON r.patient_id = p.id
                WHERE r.id = $1
            `;

            const result = await pool.query(query, [reportId]);
            return result.rows[0];
        } catch (error) {
            throw error;
        }
    }

    static async createReportIteration(iterationData) {
        try {
            const { reportId, changes } = iterationData;

            const query = `
                INSERT INTO report_iterations (id, report_id, changes)
                VALUES ($1, $2, $3)
                RETURNING *
            `;

            const values = [uuidv4(), reportId, changes];
            const result = await pool.query(query, values);
            return result.rows[0];
        } catch (error) {
            throw error;
        }
    }

    static async getReportIterations(reportId) {
        try {
            const query = `
                SELECT * FROM report_iterations
                WHERE report_id = $1
                ORDER BY created_at DESC
            `;

            const result = await pool.query(query, [reportId]);
            return result.rows;
        } catch (error) {
            throw error;
        }
    }

    static async checkReportAccess(reportId, userId, userRole) {
        try {
            const query = `
                SELECT id FROM medical_reports 
                WHERE id = $1 AND ${userRole}_id = $2
            `;

            const result = await pool.query(query, [reportId, userId]);
            return result.rows.length > 0;
        } catch (error) {
            throw error;
        }
    }

    static async generateAIReport(appointmentData) {
        try {
            // In a real application, this would integrate with an AI service
            // For now, we'll generate a mock report
            return {
                diagnosis: `AI-generated diagnosis for appointment ${appointmentData.id}`,
                prescription: `AI-generated prescription based on symptoms`,
                notes: `Additional notes from AI analysis`
            };
        } catch (error) {
            throw error;
        }
    }

    static async markReportAsSent(reportId, doctorId) {
        try {
            const query = `
                UPDATE medical_reports
                SET sent_to_patient = TRUE, updated_at = CURRENT_TIMESTAMP
                WHERE id = $1 AND doctor_id = $2
                RETURNING *
            `;

            const result = await pool.query(query, [reportId, doctorId]);
            if (result.rows.length === 0) {
                throw new Error('Report not found or unauthorized');
            }
            return result.rows[0];
        } catch (error) {
            throw error;
        }
    }
    static async updatePatientRating(reportId, patientId, rating) {
        try {
            // Validate rating is 1-5
            if (rating < 1 || rating > 5) throw new Error('Rating must be between 1 and 5');
            const query = `
                UPDATE medical_reports
                SET patient_rating = $1, updated_at = CURRENT_TIMESTAMP
                WHERE id = $2 AND patient_id = $3 AND sent_to_patient = TRUE
                RETURNING *
            `;
            const result = await pool.query(query, [rating, reportId, patientId]);
            if (result.rows.length === 0) throw new Error('Report not found or unauthorized');
            return result.rows[0];
        } catch (error) {
            throw error;
        }
    }

    static async getLastAIReportStats(doctorId) {
        try {
            // Get the most recent AI-generated report with a recorded generation time
            const lastQuery = `
                SELECT generation_time_seconds, created_at
                FROM medical_reports
                WHERE doctor_id = $1 AND ai_generated = TRUE AND generation_time_seconds IS NOT NULL
                ORDER BY created_at DESC
                LIMIT 1
            `;
            const lastResult = await pool.query(lastQuery, [doctorId]);

            // Count total AI reports
            const countResult = await pool.query(
                'SELECT COUNT(*) as total FROM medical_reports WHERE doctor_id = $1 AND ai_generated = TRUE',
                [doctorId]
            );

            return {
                last_generation_seconds: lastResult.rows[0]?.generation_time_seconds || null,
                last_report_date: lastResult.rows[0]?.created_at || null,
                total_ai_reports: parseInt(countResult.rows[0]?.total || 0)
            };
        } catch (error) {
            throw error;
        }
    }

    static async deleteReport(reportId, doctorId) {
        try {
            const query = `
                DELETE FROM medical_reports
                WHERE id = $1 AND doctor_id = $2
                RETURNING *
            `;
            const result = await pool.query(query, [reportId, doctorId]);
            if (result.rows.length === 0) {
                throw new Error('Report not found or unauthorized');
            }
            return result.rows[0];
        } catch (error) {
            throw error;
        }
    }
}

module.exports = Report;