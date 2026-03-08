const pool = require('../config/db.config');
const emailService = require('../utils/email.service');
const { v4: uuidv4 } = require('uuid');

class NotificationService {
    static async createInAppNotification(userId, title, message, type) {
        try {
            const query = `
                INSERT INTO notifications (id, user_id, title, message, type)
                VALUES ($1, $2, $3, $4, $5)
            `;
            await pool.query(query, [uuidv4(), userId, title, message, type]);
        } catch (error) {
            console.error('[NotificationService] Error creating in-app notification:', error);
        }
    }

    static async checkReminders() {
        try {
            const now = new Date();
            console.log(`[NotificationService] Checking for reminders at ${now.toISOString()}`);

            // 1. Check for 30-minute reminders
            const query30m = `
                SELECT a.*, p.first_name as patient_first_name, p.last_name as patient_last_name, p.email as patient_email,
                       d.first_name as doctor_first_name, d.last_name as doctor_last_name
                FROM appointments a
                JOIN patients p ON a.patient_id = p.id
                JOIN doctors d ON a.doctor_id = d.id
                WHERE a.status = 'scheduled'
                AND a.reminded_30m = false
                AND a.appointment_date = CURRENT_DATE
                AND a.appointment_time BETWEEN (CURRENT_TIME + interval '29 minutes') AND (CURRENT_TIME + interval '31 minutes')
            `;
            const result30m = await pool.query(query30m);
            for (const app of result30m.rows) {
                console.log(`[NotificationService] Sending 30m reminder for appointment ${app.id}`);
                const title = "Appointment Reminder (30m)";
                const message = `Your ${app.appointment_type} appointment with Dr. ${app.doctor_first_name} ${app.doctor_last_name} starts in 30 minutes. Reason: ${app.reason}`;

                // Email to patient
                const sent = await emailService.sendAppointmentReminder(
                    app.patient_email,
                    `${app.patient_first_name} ${app.patient_last_name}`,
                    `${app.doctor_first_name} ${app.doctor_last_name}`,
                    app.appointment_date,
                    app.appointment_time,
                    app.reason,
                    app.appointment_type,
                    '30m'
                );

                // In-app for both
                await this.createInAppNotification(app.patient_id, title, message, 'reminder_30m');
                await this.createInAppNotification(app.doctor_id, title, `Scheduled: ${app.appointment_type} with ${app.patient_first_name} ${app.patient_last_name} in 30m.`, 'reminder_30m');

                if (sent) {
                    await pool.query('UPDATE appointments SET reminded_30m = true WHERE id = $1', [app.id]);
                }
            }

            // 2. Check for 5-minute reminders
            const query5m = `
                SELECT a.*, p.first_name as patient_first_name, p.last_name as patient_last_name, p.email as patient_email,
                       d.first_name as doctor_first_name, d.last_name as doctor_last_name
                FROM appointments a
                JOIN patients p ON a.patient_id = p.id
                JOIN doctors d ON a.doctor_id = d.id
                WHERE a.status = 'scheduled'
                AND a.reminded_5m = false
                AND a.appointment_date = CURRENT_DATE
                AND a.appointment_time BETWEEN (CURRENT_TIME + interval '4 minutes') AND (CURRENT_TIME + interval '6 minutes')
            `;
            const result5m = await pool.query(query5m);
            for (const app of result5m.rows) {
                console.log(`[NotificationService] Sending 5m reminder for appointment ${app.id}`);
                const title = "Appointment Reminder (5m)";
                const message = `Your ${app.appointment_type} appointment with Dr. ${app.doctor_first_name} ${app.doctor_last_name} starts in 5 minutes. Please be ready!`;

                // Email to patient
                const sent = await emailService.sendAppointmentReminder(
                    app.patient_email,
                    `${app.patient_first_name} ${app.patient_last_name}`,
                    `${app.doctor_first_name} ${app.doctor_last_name}`,
                    app.appointment_date,
                    app.appointment_time,
                    app.reason,
                    app.appointment_type,
                    '5m'
                );

                // In-app for both
                await this.createInAppNotification(app.patient_id, title, message, 'reminder_5m');
                await this.createInAppNotification(app.doctor_id, title, `Consultation starting: ${app.appointment_type} with ${app.patient_first_name} ${app.patient_last_name} in 5m.`, 'reminder_5m');

                if (sent) {
                    await pool.query('UPDATE appointments SET reminded_5m = true WHERE id = $1', [app.id]);
                }
            }

        } catch (error) {
            console.error('[NotificationService] Error checking reminders:', error);
        }
    }

    static start() {
        console.log('[NotificationService] Starting appointment reminder service...');
        setInterval(() => this.checkReminders(), 60000);
        this.checkReminders();
    }
}

module.exports = NotificationService;
