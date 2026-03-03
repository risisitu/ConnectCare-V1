const pool = require('./src/config/db.config');

async function migrate() {
    try {
        console.log('Starting migration: Adding reminder flags to appointments table...');
        await pool.query(`
            ALTER TABLE appointments 
            ADD COLUMN IF NOT EXISTS reminded_30m BOOLEAN DEFAULT false,
            ADD COLUMN IF NOT EXISTS reminded_5m BOOLEAN DEFAULT false;
        `);
        console.log('Migration completed successfully.');
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

migrate();
