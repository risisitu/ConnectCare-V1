const pool = require('../config/db.config');
const { v4: uuidv4 } = require('uuid');

class AuthModel {
    static async createPasswordReset(email, role, otp, expiresAt) {
        try {
            const id = uuidv4();
            const query = `
                INSERT INTO password_resets (id, email, role, otp, expires_at, used)
                VALUES ($1, $2, $3, $4, $5, $6)
                RETURNING *
            `;
            const values = [id, email, role, otp, expiresAt, false];
            const result = await pool.query(query, values);
            return result.rows[0];
        } catch (error) {
            throw error;
        }
    }

    static async getValidResetByEmailAndOtp(email, role, otp) {
        try {
            const query = `
                SELECT * FROM password_resets
                WHERE email = $1 AND role = $2 AND otp = $3 AND used = false AND expires_at > NOW()
                ORDER BY created_at DESC
                LIMIT 1
            `;
            const result = await pool.query(query, [email, role, otp]);
            return result.rows[0];
        } catch (error) {
            throw error;
        }
    }

    static async markResetUsed(id) {
        try {
            const query = `UPDATE password_resets SET used = true WHERE id = $1 RETURNING *`;
            const result = await pool.query(query, [id]);
            return result.rows[0];
        } catch (error) {
            throw error;
        }
    }

    static async updatePasswordByEmailRole(email, role, hashedPassword) {
        try {
            let query;
            if (role === 'patient') {
                query = `UPDATE patients SET password = $1 WHERE email = $2 RETURNING id, email`;
            } else if (role === 'doctor') {
                query = `UPDATE doctors SET password = $1 WHERE email = $2 RETURNING id, email`;
            } else {
                throw new Error('Invalid role');
            }
            const result = await pool.query(query, [hashedPassword, email]);
            return result.rows[0];
        } catch (error) {
            throw error;
        }
    }
}

module.exports = AuthModel;
