const express = require('express');
const router = express.Router();
const messageController = require('../controllers/message.controller');
// const auth = require('../middleware/auth'); // Uncomment if auth is needed

// Get messages for an appointment
// router.get('/:appointmentId', auth, messageController.getMessages);
router.get('/:appointmentId', messageController.getMessages);

module.exports = router;
