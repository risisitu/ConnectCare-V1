const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function createAuditTable() {
    try {
        await pool.query(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id SERIAL PRIMARY KEY,
        admin_id VARCHAR(36) NOT NULL,
        admin_name VARCHAR(100) NOT NULL,
        action_type VARCHAR(50) NOT NULL,
        target_name VARCHAR(150),
        target_role VARCHAR(50),
        details TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
        console.log('Successfully created audit_logs table');
    } catch (error) {
        console.error('Error creating audit_logs table:', error);
    } finally {
        pool.end();
    }
}

createAuditTable();
