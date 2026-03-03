const express = require('express');
const router = express.Router();
const ReportController = require('../controllers/report.controller');
const authMiddleware = require('../middleware/auth.middleware');

// All routes require authentication
router.use(authMiddleware);

router.post('/appointments/:appointmentId/reports', ReportController.generateReport);
router.post('/appointments/:appointmentId/ai-reports', ReportController.generateAIReport);
router.get('/reports', ReportController.getAllReports);
router.get('/reports/:reportId', ReportController.getReport);
router.put('/reports/:reportId/content', ReportController.updateReportContent);
router.post('/reports/:reportId/send', ReportController.sendReportToPatient);
router.put('/reports/:reportId', ReportController.updateReportStatus);
router.post('/reports/:reportId/rate', ReportController.rateReport);
router.delete('/reports/:reportId', ReportController.deleteReport);

module.exports = router;