import nodemailer from 'nodemailer';

// Cấu hình Nodemailer transport
// TODO: Thay thế bằng credentials thật từ biến môi trường
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.mailtrap.io',
  port: parseInt(process.env.SMTP_PORT || '2525'),
  auth: {
    user: process.env.SMTP_USER || 'dummy_user',
    pass: process.env.SMTP_PASS || 'dummy_pass',
  },
});

export const sendEmail = async (to: string, subject: string, htmlContent: string) => {
  try {
    const info = await transporter.sendMail({
      from: '"V-Shop Notifications" <no-reply@vshop.com>',
      to,
      subject,
      html: htmlContent,
    });
    console.log('Message sent: %s', info.messageId);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
};
