const express = require('express');
const router = express.Router();
const availabilityController = require('../controllers/availability.controller');
const authMiddleware = require('../middleware/auth.middleware');

// Public route to get slots (Patient view) - or maybe protected but accessible to patients
router.get('/:doctorId', availabilityController.getDoctorSlots);

// Protected routes (Doctor only)
router.post('/', authMiddleware, availabilityController.addSlots);
router.delete('/:id', authMiddleware, availabilityController.removeSlot);

module.exports = router;
