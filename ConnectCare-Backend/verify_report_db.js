const { Pool } = require('pg');
const fetch = global.fetch || require('node-fetch'); // Fallback if older node

// Load env - simplistic loader since we can't rely on dotenv being installed globally for this script if run via node
// We'll just hardcode or read from file if needed, but for this quick script let's try to grab from process or hardcode valid defaults we see in .env or config
// Better: require the app's db config
require('dotenv').config();
const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'connectcare',
    password: process.env.DB_PASSWORD || 'root',
    port: process.env.DB_PORT || 5432,
});

async function verify() {
    try {
        console.log("Checking appointments with messages...");
        const res = await pool.query(`
            SELECT a.id, a.patient_id, a.doctor_id, COUNT(m.id) as msg_count 
            FROM appointments a 
            JOIN messages m ON a.id = m.appointment_id 
            GROUP BY a.id 
            HAVING COUNT(m.id) > 0 
            LIMIT 1
        `);

        if (res.rows.length === 0) {
            console.log("No appointments with messages found.");
            return;
        }

        const appointment = res.rows[0];
        console.log("Found appointment:", appointment.id, "with", appointment.msg_count, "messages.");

        // Now verify we can trigger the AI report endpoint
        // Need a token? The route is protected.
        // We'll skip the API call for a moment and just check if ANY report exists for this appointment

        const reportCheck = await pool.query('SELECT * FROM medical_reports WHERE appointment_id = $1', [appointment.id]);
        if (reportCheck.rows.length > 0) {
            console.log("Report ALREADY exists for this appointment:", reportCheck.rows[0].id);
            console.log("Status:", reportCheck.rows[0].status);
            console.log("AI Generated:", reportCheck.rows[0].ai_generated);
        } else {
            console.log("No report found for this appointment yet.");
        }

        // List all reports to see if any were generated recently
        const allReports = await pool.query('SELECT * FROM medical_reports ORDER BY created_at DESC LIMIT 5');
        console.log("Recent reports:", allReports.rows.map(r => ({ id: r.id, appt: r.appointment_id, created: r.created_at })));

    } catch (e) {
        console.error("Error:", e);
    } finally {
        await pool.end();
    }
}

verify();
