const Message = require('../models/message.model');

exports.getMessages = async (req, res) => {
    try {
        const { appointmentId } = req.params;
        const messages = await Message.getMessagesByAppointmentId(appointmentId);
        res.status(200).json(messages);
    } catch (error) {
        console.error('Error fetching messages:', error);
        res.status(500).json({ message: 'Error fetching messages' });
    }
};
