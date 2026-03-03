const pool = require('../config/db.config');

class Notification {
    static async getByUserId(userId) {
        try {
            const query = `
                SELECT * FROM notifications 
                WHERE user_id = $1 
                ORDER BY created_at DESC 
                LIMIT 20
            `;
            const result = await pool.query(query, [userId]);
            return result.rows;
        } catch (error) {
            throw error;
        }
    }

    static async markAsRead(id, userId) {
        try {
            const query = `
                UPDATE notifications 
                SET is_read = true 
                WHERE id = $1 AND user_id = $2
                RETURNING *
            `;
            const result = await pool.query(query, [id, userId]);
            return result.rows[0];
        } catch (error) {
            throw error;
        }
    }

    static async markAllAsRead(userId) {
        try {
            const query = `
                UPDATE notifications 
                SET is_read = true 
                WHERE user_id = $1
            `;
            await pool.query(query, [userId]);
            return true;
        } catch (error) {
            throw error;
        }
    }
}

module.exports = Notification;
