const { Pool } = require('pg');
const DeepSeekService = require('./src/services/deepseek.service');
const Report = require('./src/models/report.model');
const Appointment = require('./src/models/appointment.model');
const Message = require('./src/models/message.model');
const EmailService = require('./src/utils/email.service');
const Doctor = require('./src/models/doctor.model');
require('dotenv').config();

// Mock req/res for controller method logic, OR just call the logic directly
// Let's replicate the logic from ReportController.generateAIReport to verify it step-by-step

const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'connectcare',
    password: process.env.DB_PASSWORD || 'root',
    port: process.env.DB_PORT || 5432,
});

async function run() {
    const appointmentId = '1c4a1af1-73df-4d05-8076-03722049a85b'; // ID from recent appointment today

    try {
        console.log("Fetching appointment...");
        const appointment = await Appointment.getAppointmentById(appointmentId);
        if (!appointment) throw new Error("Appointment not found");
        console.log("Appointment found:", appointment.id);

        console.log("Fetching messages...");
        const messages = await Message.getMessagesByAppointmentId(appointmentId);
        console.log("Messages found:", messages.length);

        const conversationText = messages.map(m => `${m.sender_name}: ${m.content}`).join('\n');
        console.log("Conversation preview:", conversationText.substring(0, 100) + "...");

        console.log("Calling DeepSeek API...");
        try {
            const aiReportData = await DeepSeekService.generateMedicalReport(conversationText);
            console.log("AI Data Received:", JSON.stringify(aiReportData, null, 2).substring(0, 200) + "...");

            // Save
            const reportData = {
                appointmentId,
                patientId: appointment.patient_id,
                doctorId: appointment.doctor_id,
                diagnosis: aiReportData.assessment || 'Pending',
                prescription: aiReportData.treatment_plan || 'Pending',
                notes: JSON.stringify(aiReportData),
                aiGenerated: true
            };

            console.log("Saving report...");
            const report = await Report.createReport(reportData);
            console.log("Report saved with ID:", report.id);

            // Email
            console.log("Sending email...");
            const doctor = await Doctor.getDoctorById(appointment.doctor_id);
            if (doctor && doctor.email) {
                const doctorName = `${appointment.doctor_first_name} ${appointment.doctor_last_name}`;
                const patientName = `${appointment.patient_first_name} ${appointment.patient_last_name}`;
                await EmailService.sendMedicalReport(doctor.email, doctorName, patientName, aiReportData, report.id);
            } else {
                console.log("Doctor email not found");
            }

        } catch (e) {
            console.error("AI Generation or Saving failed:", e);
        }

    } catch (e) {
        console.error("Error:", e);
    } finally {
        await pool.end();
        process.exit();
    }
}

run();
