const Notification = require('../models/notification.model');

class NotificationController {
    static async getMyNotifications(req, res) {
        try {
            const userId = req.user.id;
            const notifications = await Notification.getByUserId(userId);
            res.json({ success: true, data: notifications });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

    static async markAsRead(req, res) {
        try {
            const userId = req.user.id;
            const { id } = req.params;
            const notification = await Notification.markAsRead(id, userId);
            if (!notification) {
                return res.status(404).json({ success: false, error: 'Notification not found' });
            }
            res.json({ success: true, data: notification });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

    static async markAllAsRead(req, res) {
        try {
            const userId = req.user.id;
            await Notification.markAllAsRead(userId);
            res.json({ success: true, message: 'All notifications marked as read' });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }
}

module.exports = NotificationController;
