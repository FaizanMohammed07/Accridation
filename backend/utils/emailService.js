const nodemailer = require("nodemailer");

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: process.env.SMTP_PORT || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  async sendEmail({ to, subject, text, html, attachments }) {
    try {
      const mailOptions = {
        from: `"AccridiTech System" <${
          process.env.SMTP_FROM || process.env.SMTP_USER
        }>`,
        to,
        subject,
        text,
        html,
        attachments,
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log("Email sent successfully:", result.messageId);
      return result;
    } catch (error) {
      console.error("Email sending failed:", error);
      throw error;
    }
  }

  async sendPasswordReset(email, resetToken, userName) {
    const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Password Reset Request</h2>
        <p>Hello ${userName},</p>
        <p>You have requested to reset your password for your AccridiTech account.</p>
        <p>Please click the link below to reset your password:</p>
        <a href="${resetUrl}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Reset Password</a>
        <p><strong>This link will expire in 10 minutes.</strong></p>
        <p>If you did not request this password reset, please ignore this email.</p>
        <hr>
        <p style="color: #6b7280; font-size: 12px;">AccridiTech Accreditation Management System</p>
      </div>
    `;

    return this.sendEmail({
      to: email,
      subject: "Password Reset Request - AccridiTech",
      html,
    });
  }

  async sendDocumentAssignment(email, userName, documentTitle, role, dueDate) {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Document Assignment Notification</h2>
        <p>Hello ${userName},</p>
        <p>You have been assigned as a <strong>${role}</strong> for the following document:</p>
        <div style="background-color: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
          <h3 style="margin: 0; color: #374151;">${documentTitle}</h3>
          <p><strong>Due Date:</strong> ${new Date(
            dueDate
          ).toLocaleDateString()}</p>
        </div>
        <p>Please log in to your AccridiTech dashboard to review the assigned document.</p>
        <a href="${
          process.env.CLIENT_URL
        }/dashboard" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Go to Dashboard</a>
        <hr>
        <p style="color: #6b7280; font-size: 12px;">AccridiTech Accreditation Management System</p>
      </div>
    `;

    return this.sendEmail({
      to: email,
      subject: `Document Assignment - ${documentTitle}`,
      html,
    });
  }

  async sendStatusUpdate(email, userName, documentTitle, oldStatus, newStatus) {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Document Status Update</h2>
        <p>Hello ${userName},</p>
        <p>The status of your document has been updated:</p>
        <div style="background-color: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
          <h3 style="margin: 0; color: #374151;">${documentTitle}</h3>
          <p><strong>Previous Status:</strong> ${oldStatus
            .replace(/_/g, " ")
            .toUpperCase()}</p>
          <p><strong>Current Status:</strong> ${newStatus
            .replace(/_/g, " ")
            .toUpperCase()}</p>
        </div>
        <p>Please log in to your dashboard for more details.</p>
        <a href="${
          process.env.CLIENT_URL
        }/dashboard" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">View Details</a>
        <hr>
        <p style="color: #6b7280; font-size: 12px;">AccridiTech Accreditation Management System</p>
      </div>
    `;

    return this.sendEmail({
      to: email,
      subject: `Status Update - ${documentTitle}`,
      html,
    });
  }
}

module.exports = new EmailService();
