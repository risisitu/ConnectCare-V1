const express = require('express');
const router = express.Router();
const AppointmentController = require('../controllers/appointment.controller');
const authMiddleware = require('../middleware/auth.middleware');

console.log('Setting up appointment routes...');

// All routes require authentication
router.use(authMiddleware);
console.log('Authentication middleware applied to appointment routes.');
router.post('/createAppointment', AppointmentController.createAppointment);
router.get('/getAppointment', AppointmentController.getAppointments);
router.get('/:appointmentId', AppointmentController.getAppointmentById);
router.put('/:appointmentId', AppointmentController.updateAppointmentStatus);
router.post('/:appointmentId/video', AppointmentController.generateVideoCallLink);
router.post('/video-call-invite', AppointmentController.sendVideoCallInvite);

module.exports = router;