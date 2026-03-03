const express = require('express');
const router = express.Router();
const AdminController = require('../controllers/admin.controller');
const authMiddleware = require('../middleware/auth.middleware');

const adminMiddleware = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({ success: false, error: 'Forbidden' });
    }
};

// Admin login route
router.post('/login', AdminController.login);

// Protected routes
router.use(authMiddleware, adminMiddleware);
router.get('/users', AdminController.getAllUsers);
router.put('/users/:type/:id/status', AdminController.updateUserStatus);

module.exports = router;
