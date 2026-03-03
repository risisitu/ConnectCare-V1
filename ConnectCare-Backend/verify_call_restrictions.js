const AppointmentController = require('./src/controllers/appointment.controller');
const Appointment = require('./src/models/appointment.model');
const pool = require('./src/config/db.config');

async function runTest() {
    console.log('--- Test 1: Past Appointment ---');
    const req1 = {
        user: { id: 'some-id', role: 'patient' },
        body: {
            appointmentId: '3bca375d-ddf2-41f9-a5de-b37b3bd03fdb', // Past date
            link: 'http://test.com'
        }
    };
    const res1 = {
        status: function (code) { this.statusCode = code; return this; },
        json: function (data) { this.data = data; return this; }
    };
    await AppointmentController.sendVideoCallInvite(req1, res1);
    console.log('Status:', res1.statusCode);
    console.log('Response:', res1.data);

    console.log('\n--- Test 2: Completed Appointment ---');
    // First, let's mark one as completed
    const appId = '3bca375d-ddf2-41f9-a5de-b37b3bd03fdb';
    await pool.query("UPDATE appointments SET status = 'completed' WHERE id = $1", [appId]);

    const req2 = {
        user: { id: 'some-id', role: 'patient' },
        body: {
            appointmentId: appId,
            link: 'http://test.com'
        }
    };
    const res2 = {
        status: function (code) { this.statusCode = code; return this; },
        json: function (data) { this.data = data; return this; }
    };
    await AppointmentController.sendVideoCallInvite(req2, res2);
    console.log('Status:', res2.statusCode);
    console.log('Response:', res2.data);

    // Cleanup
    await pool.query("UPDATE appointments SET status = 'scheduled' WHERE id = $1", [appId]);
    process.exit();
}

runTest();
