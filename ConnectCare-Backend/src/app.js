const express = require('express');
const cors = require('cors');
require('dotenv').config();
const authMiddleware = require('./middleware/auth.middleware');

const app = express();

// Test route before any middleware
app.get('/test', (req, res) => {
    console.log('Basic test route hit');
    res.json({ message: 'Basic route is working' });
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
    console.log('Request received:');
    console.log('URL:', req.url);
    console.log('Method:', req.method);
    console.log('Headers:', req.headers);
    next();
});

// Import routes
const doctorRoutes = require('./routes/doctor.routes');
const patientRoutes = require('./routes/patient.routes');
const appointmentRoutes = require('./routes/appointment.routes');
const messageRoutes = require('./routes/message.routes');
const authRoutes = require('./routes/auth.routes');
const reportRoutes = require('./routes/report.routes');
const adminRoutes = require('./routes/admin.routes');

// Root route
app.get('/', (req, res) => {
    console.log('Root route hit');
    res.json({ message: 'Welcome to ConnectCare API' });
});

// API Routes
app.get('/api/test', (req, res) => {
    console.log('API test route hit');
    res.json({ message: 'API route is working' });
});

// Token verification route
app.post('/api/verify-token', authMiddleware, (req, res) => {
    // If middleware passes, token is valid
    console.log('Token verified for user:', req.user);
    res.json({
        success: true,
        message: 'Token is valid',
        user: {
            id: req.user.id,
            email: req.user.email,
            role: req.user.role
        }
    });
});

// Register main routes
app.use('/api/doctors', doctorRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/availability', require('./routes/availability.routes'));
app.use('/api/notifications', require('./routes/notification.routes'));
app.use('/api', reportRoutes); // Routes inside report.routes.js already have /appointments/... or /reports/...


// 404 handler - catch unmatched routes
app.use((req, res) => {
    console.log('404 - Route not found:', req.method, req.url);
    res.status(404).json({
        success: false,
        error: 'Route not found',
        path: req.url,
        method: req.method
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error occurred:', err);
    res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: err.message
    });
});

const PORT = process.env.PORT || 3000;

// Start server
const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`Network access: http://192.168.1.140:${PORT}`);
});

// Initialize Socket.IO
const { initSocket } = require('./socket/socket.handler');
initSocket(server);

// Start Notification Service (Reminders)
const NotificationService = require('./services/notification.service');
NotificationService.start();

// Handle server errors
server.on('error', (error) => {
    console.error('Server error:', error);
    process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    console.error('Uncaught exception:', error);
    process.exit(1);
});