const pool = require('../config/db.config');
const { v4: uuidv4 } = require('uuid');

class Message {
    static async createMessage({ appointmentId, senderId, senderName, content, time }) {
        try {
            const query = `
                INSERT INTO messages (
                    id, 
                    appointment_id, 
                    sender_id, 
                    sender_name, 
                    content,
                    created_at
                )
                VALUES ($1, $2, $3, $4, $5, $6)
                RETURNING *
            `;

            // Use provided time or current time
            const createdAt = time ? new Date(time) : new Date();

            const values = [
                uuidv4(),
                appointmentId,
                senderId,
                senderName,
                content,
                createdAt
            ];

            const result = await pool.query(query, values);
            return result.rows[0];
        } catch (error) {
            throw error;
        }
    }

    static async getMessagesByAppointmentId(appointmentId) {
        try {
            const query = `
                SELECT * FROM messages 
                WHERE appointment_id = $1
                ORDER BY created_at ASC
            `;

            const result = await pool.query(query, [appointmentId]);
            return result.rows;
        } catch (error) {
            throw error;
        }
    }
}

module.exports = Message;
