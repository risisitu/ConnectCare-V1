const pool = require('../config/db.config');

class AuditLog {
    static async createLog({ adminId, adminName, actionType, targetName, targetRole, details }) {
        const query = `
            INSERT INTO audit_logs 
            (admin_id, admin_name, action_type, target_name, target_role, details) 
            VALUES ($1, $2, $3, $4, $5, $6) 
            RETURNING *;
        `;

        try {
            const result = await pool.query(query, [
                adminId,
                adminName,
                actionType,
                targetName,
                targetRole,
                details
            ]);
            return result.rows[0];
        } catch (error) {
            console.error('Error creating audit log:', error);
            throw error;
        }
    }

    static async getAllLogs() {
        const query = `
            SELECT id, admin_id, admin_name, action_type, target_name, target_role, details, created_at 
            FROM audit_logs 
            ORDER BY created_at DESC
        `;

        try {
            const result = await pool.query(query);
            return result.rows;
        } catch (error) {
            console.error('Error fetching audit logs:', error);
            throw error;
        }
    }
}

module.exports = AuditLog;
