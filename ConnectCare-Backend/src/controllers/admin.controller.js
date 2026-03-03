const jwt = require('jsonwebtoken');
const pool = require('../config/db.config');

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
            const { type, id } = req.params;
            const { status } = req.body;

            if (!['active', 'inactive'].includes(status)) {
                return res.status(400).json({ success: false, error: 'Invalid status' });
            }

            let query = '';
            if (type === 'doctor') {
                query = 'UPDATE doctors SET status = $1 WHERE id = $2 RETURNING id, status';
            } else if (type === 'patient') {
                query = 'UPDATE patients SET status = $1 WHERE id = $2 RETURNING id, status';
            } else {
                return res.status(400).json({ success: false, error: 'Invalid user type' });
            }

            const result = await pool.query(query, [status, id]);

            if (result.rows.length === 0) {
                return res.status(404).json({ success: false, error: 'User not found' });
            }

            return res.json({
                success: true,
                data: result.rows[0]
            });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }
}

module.exports = AdminController;
