import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD
      }
    });
  }

  async sendOTP(email, otp) {
    try {
      const mailOptions = {
        from: {
          name: process.env.SMTP_FROM_NAME || 'WorkEase System',
          address: process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER
        },
        to: email,
        subject: process.env.EMAIL_OTP_SUBJECT || 'Your OTP Code - WorkEase',
        html: this.getOTPTemplate(otp),
        text: `Your OTP code is: ${otp}. This code will expire in ${process.env.OTP_EXPIRY_MINUTES || 5} minutes.`
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log(`Email sent to ${email}: ${info.messageId}`);
      return true;
    } catch (error) {
      console.error('Email sending failed:', error);
      throw new Error('Failed to send OTP email');
    }
  }

  getOTPTemplate(otp) {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>OTP Verification</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0;">WorkEase</h1>
            <p style="color: rgba(255,255,255,0.8); margin: 10px 0 0 0;">OTP Verification</p>
          </div>
          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #ddd;">
            <h2 style="color: #333;">Your OTP Code</h2>
            <p>Please use the OTP below to complete your verification:</p>
            
            <div style="background: white; padding: 20px; border-radius: 5px; text-align: center; margin: 30px 0; border: 2px dashed #667eea;">
              <h1 style="font-size: 48px; letter-spacing: 10px; color: #667eea; margin: 0;">${otp}</h1>
            </div>
            
            <p>This OTP will expire in <strong>${process.env.OTP_EXPIRY_MINUTES || 5} minutes</strong>.</p>
            
            <p>If you didn't request this OTP, please ignore this email.</p>
            
            <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; color: #666; font-size: 14px;">
              <p>Best regards,<br>The WorkEase Team</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }
}

export default new EmailService();