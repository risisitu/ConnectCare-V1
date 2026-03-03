const http = require('http');

// Helper function to make a GET request
function get(url) {
    return new Promise((resolve, reject) => {
        http.get(url, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    resolve({
                        statusCode: res.statusCode,
                        data: JSON.parse(data)
                    });
                } catch (e) {
                    resolve({
                        statusCode: res.statusCode,
                        data: data
                    });
                }
            });
        }).on('error', reject);
    });
}

async function verify() {
    console.log('Verifying Doctor Appointments API...');

    // 1. First, we need a valid doctor ID. 
    // We'll try to fetch all doctors first to get an ID.
    try {
        console.log('Fetching list of doctors...');
        const doctorsRes = await get('http://localhost:3000/api/doctors/getallDoctors');

        if (doctorsRes.statusCode !== 200 || !doctorsRes.data.success) {
            console.error('Failed to get doctors:', doctorsRes.data);
            return;
        }

        const doctors = doctorsRes.data.data;
        if (doctors.length === 0) {
            console.warn('No doctors found in the database. Cannot verify specific doctor appointments.');
            return;
        }

        const doctorId = doctors[0].id;
        console.log(`Testing with Doctor ID: ${doctorId}`);

        // 2. Now test the new endpoint
        console.log(`Fetching appointments for Doctor ID: ${doctorId}`);
        const appointmentsRes = await get(`http://localhost:3000/api/doctors/${doctorId}/appointments`);

        if (appointmentsRes.statusCode === 200 && appointmentsRes.data.success) {
            console.log('✅ Success! Appointment data received:');
            console.log(`Found ${appointmentsRes.data.data.length} appointments.`);
            // console.log(JSON.stringify(appointmentsRes.data.data, null, 2));
        } else {
            console.error('❌ Failed to fetch appointments:', appointmentsRes.data);
            console.log('Note: If you receive a 404, please restart the backend server.');
        }

    } catch (error) {
        console.error('Error during verification:', error.message);
        console.log('Is the server running on port 3000?');
    }
}

verify();
