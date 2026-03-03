const AuthModel = require('../models/auth.model');
const otpService = require('../utils/otp.service');
const bcrypt = require('bcryptjs');

class AuthController {
    static async forgotPassword(req, res) {
        try {
            const { email, role } = req.body;
            if (!email || !role) {
                return res.status(400).json({ success: false, error: 'Email and role are required' });
            }

            if (!['patient', 'doctor'].includes(role)) {
                return res.status(400).json({ success: false, error: 'Role must be patient or doctor' });
            }

            const otp = otpService.generateOtp();
            const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

            const reset = await AuthModel.createPasswordReset(email, role, otp, expiresAt);

            // Send email (may throw)
            try {
                await otpService.sendOtpEmail(email, otp);
            } catch (err) {
                console.error('Error sending OTP email:', err.message || err);
                // Do not fail the entire request if email fails; still store reset so admin can inspect
                return res.status(500).json({ success: false, error: 'Failed to send OTP email' });
            }

            res.json({ success: true, message: 'OTP sent to email', data: { id: reset.id, expiresAt } });
        } catch (error) {
            console.error('forgotPassword error', error);
            res.status(500).json({ success: false, error: error.message });
        }
    }

    static async verifyOtp(req, res) {
        try {
            const { email, role, otp } = req.body;
            if (!email || !role || !otp) {
                return res.status(400).json({ success: false, error: 'Email, role and otp are required' });
            }

            const reset = await AuthModel.getValidResetByEmailAndOtp(email, role, otp);
            if (!reset) {
                return res.status(400).json({ success: false, error: 'Invalid or expired OTP' });
            }

            res.json({ success: true, message: 'OTP verified' });
        } catch (error) {
            console.error('verifyOtp error', error);
            res.status(500).json({ success: false, error: error.message });
        }
    }

    static async resetPassword(req, res) {
        try {
            const { email, role, otp, newPassword } = req.body;
            if (!email || !role || !otp || !newPassword) {
                return res.status(400).json({ success: false, error: 'Email, role, otp and newPassword are required' });
            }

            const reset = await AuthModel.getValidResetByEmailAndOtp(email, role, otp);
            if (!reset) {
                return res.status(400).json({ success: false, error: 'Invalid or expired OTP' });
            }

            // Hash and update password
            const hashedPassword = await bcrypt.hash(newPassword, 10);
            const updated = await AuthModel.updatePasswordByEmailRole(email, role, hashedPassword);
            if (!updated) {
                return res.status(404).json({ success: false, error: 'User not found' });
            }

            await AuthModel.markResetUsed(reset.id);

            res.json({ success: true, message: 'Password updated successfully' });
        } catch (error) {
            console.error('resetPassword error', error);
            res.status(500).json({ success: false, error: error.message });
        }
    }
}

module.exports = AuthController;
