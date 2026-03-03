const pool = require('../src/config/db.config');

const createTableQuery = `
    DROP TABLE IF EXISTS doctor_availability;
    CREATE TABLE doctor_availability (
        id UUID PRIMARY KEY,
        doctor_id VARCHAR(255) REFERENCES doctors(id) ON DELETE CASCADE,
        start_time TIMESTAMP NOT NULL,
        end_time TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT valid_time_range CHECK (end_time > start_time)
    );
`;

const run = async () => {
    try {
        await pool.query(createTableQuery);
        console.log('doctor_availability table created successfully.');
    } catch (err) {
        console.error('Error creating table:', err);
    } finally {
        pool.end();
    }
};

run();
