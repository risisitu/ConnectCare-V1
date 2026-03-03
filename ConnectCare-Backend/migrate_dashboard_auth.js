const pool = require('./src/config/db.config');

async function migrate() {
    try {
        await pool.query('ALTER TABLE doctors ADD COLUMN IF NOT EXISTS monthly_target INT DEFAULT 100;');
        await pool.query('ALTER TABLE doctors ADD COLUMN IF NOT EXISTS daily_capacity INT DEFAULT 12;');
        await pool.query('ALTER TABLE doctors ADD COLUMN IF NOT EXISTS avg_consultation_time INT DEFAULT 15;');
        await pool.query('ALTER TABLE medical_reports ADD COLUMN IF NOT EXISTS patient_rating INT;');
        console.log('Migration successful');
    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        await pool.end();
    }
}
migrate();
