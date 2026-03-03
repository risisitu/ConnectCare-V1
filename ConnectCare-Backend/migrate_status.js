const pool = require('./src/config/db.config');

async function run() {
    try {
        console.log('Adding status column to doctors...');
        await pool.query("ALTER TABLE doctors ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active';");

        console.log('Adding status column to patients...');
        await pool.query("ALTER TABLE patients ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active';");

        console.log('Migration successful');
        process.exit(0);
    } catch (e) {
        console.error('Migration failed:', e);
        process.exit(1);
    }
}

run();
