const nodemailer = require('nodemailer');
const { v4: uuidv4 } = require('uuid');

function generateOtp() {
    // 6-digit numeric OTP
    return Math.floor(100000 + Math.random() * 900000).toString();
}

async function sendOtpEmail(to, otp) {
    // SMTP settings are read from env
    const host = process.env.SMTP_HOST || 'smtp.gmail.com';
    const port = parseInt(process.env.SMTP_PORT || '587', 10);
    const user = process.env.SMTP_USER || 'connectcarea@gmail.com';
    const pass = process.env.SMTP_PASS || process.env.SMTP_PASSWORD;
    const from = process.env.SMTP_FROM || user;

    if (!host || !user || !pass) {
        throw new Error('SMTP configuration is incomplete');
    }

    const transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465, // true for 465, false for other ports
        auth: {
            user,
            pass
        }
    });

    const mailOptions = {
        from,
        to,
        subject: 'ConnectCare Password Reset OTP',
        text: `Your ConnectCare password reset OTP is: ${otp}. It will expire in 10 minutes. If you did not request this, ignore this email.`,
        html: `
            <!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Your OTP Code</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background-color: #f5f5f5;
            padding: 20px;
        }
        
        .email-container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }
        
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 40px 20px;
            text-align: center;
            color: #ffffff;
        }
        
        .header h1 {
            font-size: 24px;
            font-weight: 600;
            margin-bottom: 8px;
        }
        
        .header p {
            font-size: 14px;
            opacity: 0.9;
        }
        
        .content {
            padding: 40px 30px;
        }
        
        .greeting {
            font-size: 16px;
            color: #333333;
            margin-bottom: 20px;
        }
        
        .message {
            font-size: 14px;
            color: #666666;
            line-height: 1.6;
            margin-bottom: 30px;
        }
        
        .otp-box {
            background-color: #f8f9fa;
            border: 2px dashed #667eea;
            border-radius: 8px;
            padding: 30px;
            text-align: center;
            margin-bottom: 30px;
        }
        
        .otp-label {
            font-size: 12px;
            color: #888888;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 12px;
        }
        
        .otp-code {
            font-size: 36px;
            font-weight: 700;
            color: #667eea;
            letter-spacing: 8px;
            margin-bottom: 16px;
            font-family: 'Courier New', monospace;
        }
        
        .expiry-notice {
            background-color: #fff3cd;
            border-left: 4px solid #ffc107;
            padding: 15px;
            margin-bottom: 25px;
            border-radius: 4px;
        }
        
        .expiry-notice p {
            font-size: 13px;
            color: #856404;
            margin: 0;
        }
        
        .expiry-notice strong {
            color: #664d03;
        }
        
        .security-note {
            font-size: 13px;
            color: #666666;
            line-height: 1.5;
            padding: 20px;
            background-color: #f8f9fa;
            border-radius: 6px;
            margin-bottom: 25px;
        }
        
        .security-note strong {
            color: #333333;
        }
        
        .footer {
            background-color: #f8f9fa;
            padding: 25px 30px;
            text-align: center;
            border-top: 1px solid #e9ecef;
        }
        
        .footer p {
            font-size: 12px;
            color: #888888;
            line-height: 1.5;
            margin-bottom: 8px;
        }
        
        .footer a {
            color: #667eea;
            text-decoration: none;
        }
        
        .footer a:hover {
            text-decoration: underline;
        }
        
        @media only screen and (max-width: 600px) {
            .email-container {
                border-radius: 0;
            }
            
            .content {
                padding: 30px 20px;
            }
            
            .otp-code {
                font-size: 28px;
                letter-spacing: 4px;
            }
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            <h1>🔐 Verification Code</h1>
            <p>Secure your account access</p>
        </div>
        
        <div class="content">
            <div class="greeting">
                Hello,
            </div>
            
            <div class="message">
                We received a request to verify your identity. Please use the One-Time Password (OTP) below to complete your verification.
            </div>
            
            <div class="otp-box">
                <div class="otp-label">Your OTP Code</div>
                <div class="otp-code">${otp}</div>
            </div>
            
            <div class="expiry-notice">
                <p>⏱️ <strong>Important:</strong> This OTP will expire in <strong>10 minutes</strong>. Please use it before it expires.</p>
            </div>
            
            <div class="security-note">
                <strong>Security Reminder:</strong><br>
                • Never share this code with anyone<br>
                • Our team will never ask for your OTP<br>
                • If you didn't request this code, please ignore this email
            </div>
            
            <div class="message">
                If you have any questions or need assistance, please don't hesitate to contact our support team.
            </div>
        </div>
        
        <div class="footer">
            <p>This is an automated message, please do not reply to this email.</p>
            <p>&copy; 2024 Your Company Name. All rights reserved.</p>
            <p><a href="#">Privacy Policy</a> | <a href="#">Terms of Service</a> | <a href="#">Contact Us</a></p>
        </div>
    </div>
</body>
</html>
        `
    };

    const info = await transporter.sendMail(mailOptions);
    return info;
}

async function sendGenericEmail(to, subject, text, html) {
    const host = process.env.SMTP_HOST || 'smtp.gmail.com';
    const port = parseInt(process.env.SMTP_PORT || '587', 10);
    const user = process.env.SMTP_USER || 'connectcarea@gmail.com';
    const pass = process.env.SMTP_PASS || process.env.SMTP_PASSWORD;
    const from = process.env.SMTP_FROM || user;

    if (!host || !user || !pass) {
        throw new Error('SMTP configuration is incomplete');
    }

    const transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass }
    });

    const mailOptions = {
        from,
        to,
        subject,
        text,
        html
    };

    const info = await transporter.sendMail(mailOptions);
    return info;
}

module.exports = {
    generateOtp,
    sendOtpEmail,
    sendGenericEmail
};
