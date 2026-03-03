const Availability = require('../models/availability.model');

exports.addSlots = async (req, res) => {
    try {
        const { startTime, endTime } = req.body;
        const doctorId = req.user.id; // From auth token

        // Validation: Future only
        const start = new Date(startTime);
        const now = new Date();

        if (start < now) {
            return res.status(400).json({
                success: false,
                message: 'Cannot add availability in the past'
            });
        }

        const slot = await Availability.addAvailability(doctorId, startTime, endTime);

        res.status(201).json({
            success: true,
            message: 'Slot added successfully',
            data: slot
        });

    } catch (error) {
        console.error('Error adding slot:', error);
        res.status(500).json({
            success: false,
            message: 'Error adding slot',
            error: error.message
        });
    }
};

exports.getDoctorSlots = async (req, res) => {
    try {
        const { doctorId } = req.params;
        const { startDate, endDate } = req.query; // Expects ISO strings or dates

        if (!startDate || !endDate) {
            return res.status(400).json({
                success: false,
                message: 'StartDate and EndDate are required'
            });
        }

        const slots = await Availability.getAvailability(doctorId, startDate, endDate);

        res.status(200).json({
            success: true,
            data: slots
        });

    } catch (error) {
        console.error('Error fetching slots:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching slots',
            error: error.message
        });
    }
};

exports.removeSlot = async (req, res) => {
    try {
        const { id } = req.params;
        const doctorId = req.user.id; // Verify ownership

        const result = await Availability.removeAvailability(id, doctorId);

        if (!result) {
            return res.status(404).json({
                success: false,
                message: 'Slot not found or unauthorized'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Slot removed successfully'
        });

    } catch (error) {
        console.error('Error removing slot:', error);
        res.status(500).json({
            success: false,
            message: 'Error removing slot',
            error: error.message
        });
    }
};
