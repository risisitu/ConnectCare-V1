const express = require('express');
const router = express.Router();
const PatientController = require('../controllers/patient.controller');
const authMiddleware = require('../middleware/auth.middleware');


// Public routes
router.post('/signup', PatientController.signup);
router.post('/login', PatientController.login);

// Protected routes (require authentication)
router.use(authMiddleware);
router.get('/profile', PatientController.getProfile);
router.put('/profile', PatientController.updateProfile);
router.get('/appointments', PatientController.getMyAppointments);
router.post('/appointments', PatientController.bookAppointment);


module.exports = router;