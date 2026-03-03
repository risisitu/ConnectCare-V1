const pool = require('../config/db.config');
const { v4: uuidv4 } = require('uuid');

class Availability {
    static async addAvailability(doctorId, startTime, endTime) {
        try {
            const query = `
                INSERT INTO doctor_availability (id, doctor_id, start_time, end_time)
                VALUES ($1, $2, $3, $4)
                RETURNING *
            `;
            const values = [uuidv4(), doctorId, startTime, endTime];
            const result = await pool.query(query, values);
            return result.rows[0];
        } catch (error) {
            throw error;
        }
    }

    static async getAvailability(doctorId, startDate, endDate) {
        try {
            // Get all availability slots
            const availabilityQuery = `
                SELECT id, start_time, end_time 
                FROM doctor_availability 
                WHERE doctor_id = $1 
                AND start_time >= $2 
                AND end_time <= $3
                ORDER BY start_time ASC
            `;
            const availabilityResult = await pool.query(availabilityQuery, [doctorId, startDate, endDate]);
            const availableSlots = availabilityResult.rows;

            // Get all appointments in this range to mark booked slots
            // Casting appointment_date and time to timestamp to compare is tricky without precise format
            // But we can fetch all appointments for the doctor in range and filter in JS

            const appointmentsQuery = `
                SELECT appointment_date, appointment_time 
                FROM appointments 
                WHERE doctor_id = $1 
                AND status = 'scheduled'
                AND appointment_date >= DATE($2) 
                AND appointment_date <= DATE($3)
            `;
            const appointmentsResult = await pool.query(appointmentsQuery, [doctorId, startDate, endDate]);
            const bookedSlots = appointmentsResult.rows;

            // Mark slots as booked
            // We need to match DoctorAvailability (Timestamp) with Appointment (Date + Time)
            // Assuming 1 hour slots or matching start times.

            const finalSlots = availableSlots.map(slot => {
                const slotStart = new Date(slot.start_time);
                // content of appointment_date might be "2026-02-20T00:00:00.000Z" or just string "2026-02-20"
                // appointment_time might be "13:00" or "1:00 PM"

                const isBooked = bookedSlots.some(app => {
                    const appDate = new Date(app.appointment_date);
                    // normalize dates
                    const sameDate = appDate.getFullYear() === slotStart.getFullYear() &&
                        appDate.getMonth() === slotStart.getMonth() &&
                        appDate.getDate() === slotStart.getDate();

                    if (!sameDate) return false;

                    // Normalize time
                    // Convert slotStart to time string e.g. "13:00"
                    // ConnectCare might store time as "13:00" or "01:00 PM"
                    // Let's assume standard "HH:mm" or check logic elsewhere.
                    // For now, let's look at how time handles in previous code.

                    // In a real app we'd standardize. 
                    // Let's try to parse app.appointment_time
                    // If it's "HH:mm", we can compare.

                    // Simple check:
                    const slotHours = slotStart.getHours().toString().padStart(2, '0');
                    const slotMinutes = slotStart.getMinutes().toString().padStart(2, '0');
                    const slotTimeStr = `${slotHours}:${slotMinutes}`; // "13:00"

                    // app.appointment_time might be "13:00:00" or "13:00"
                    return app.appointment_time.startsWith(slotTimeStr);
                });

                return {
                    ...slot,
                    isBooked
                };
            });

            return finalSlots;

        } catch (error) {
            throw error;
        }
    }

    static async removeAvailability(id, doctorId) {
        try {
            const query = `
                DELETE FROM doctor_availability 
                WHERE id = $1 AND doctor_id = $2
                RETURNING *
            `;
            const result = await pool.query(query, [id, doctorId]);
            return result.rows[0];
        } catch (error) {
            throw error;
        }
    }
}

module.exports = Availability;
