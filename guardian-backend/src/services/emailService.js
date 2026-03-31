const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT) || 587,
  secure: false,
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
});

transporter.verify((err) => {
  if (err) console.error('❌ Email error:', err.message);
  else console.log('📧 Email service ready');
});

const sendEmail = async ({ to, subject, html }) => {
  const info = await transporter.sendMail({ from: process.env.EMAIL_FROM, to, subject, html });
  return info;
};

const wrap = (color, headerText, bodyHtml) => `
  <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden">
    <div style="background:${color};padding:24px;color:white"><h2 style="margin:0">${headerText}</h2></div>
    <div style="padding:24px">${bodyHtml}</div>
    <div style="background:#f9fafb;padding:16px;text-align:center;color:#9ca3af;font-size:12px">© ${new Date().getFullYear()} Guardian App</div>
  </div>`;

const sendReminderEmail = (user, reminder) => sendEmail({
  to: user.email,
  subject: `⏰ Reminder: ${reminder.title}`,
  html: wrap('#4f46e5', '🛡️ Guardian Reminder', `
    <p>Hi <strong>${user.name}</strong>,</p>
    <p>This is your scheduled reminder:</p>
    <div style="background:#f3f4f6;border-left:4px solid #4f46e5;padding:16px;border-radius:4px;margin:16px 0">
      <h3 style="margin:0 0 8px">${reminder.title}</h3>
      ${reminder.description ? `<p style="margin:0;color:#6b7280">${reminder.description}</p>` : ''}
    </div>
    <p style="color:#6b7280;font-size:14px">Scheduled: <strong>${new Date(reminder.scheduledAt || reminder.dateTime).toLocaleString()}</strong></p>`),
});

const sendTaskDueEmail = (user, task) => sendEmail({
  to: user.email,
  subject: `📋 Task Due Soon: ${task.title}`,
  html: wrap('#dc2626', '📋 Task Due Soon', `
    <p>Hi <strong>${user.name}</strong>,</p>
    <div style="background:#fef2f2;border-left:4px solid #dc2626;padding:16px;border-radius:4px;margin:16px 0">
      <h3 style="margin:0 0 8px">${task.title}</h3>
      ${task.description ? `<p style="margin:0;color:#6b7280">${task.description}</p>` : ''}
      <p style="margin:8px 0 0;color:#dc2626;font-weight:bold">Priority: ${task.priority}</p>
    </div>
    <p style="color:#6b7280;font-size:14px">Due: <strong>${new Date(task.dueDate).toLocaleString()}</strong></p>`),
});

const sendNotificationEmail = (user, notification) => sendEmail({
  to: user.email,
  subject: `🔔 ${notification.title}`,
  html: wrap('#0891b2', '🔔 Guardian Notification', `
    <p>Hi <strong>${user.name}</strong>,</p>
    <div style="background:#ecfeff;border-left:4px solid #0891b2;padding:16px;border-radius:4px;margin:16px 0">
      <h3 style="margin:0 0 8px">${notification.title}</h3>
      <p style="margin:0">${notification.message}</p>
    </div>`),
});

const sendWishesEmail = (user, contact) => sendEmail({
  to: user.email,
  subject: `🎂 Birthday Today: ${contact.name}`,
  html: wrap('#7c3aed', '🎂 Birthday Reminder!', `
    <p>Hi <strong>${user.name}</strong>,</p>
    <p>Don't forget — it's <strong>${contact.name}</strong>'s birthday today! 🎉</p>
    <div style="background:#faf5ff;border-left:4px solid #7c3aed;padding:16px;border-radius:4px;margin:16px 0">
      ${contact.phone ? `<p style="margin:0">📞 ${contact.phone}</p>` : ''}
      ${contact.email ? `<p style="margin:4px 0 0">📧 ${contact.email}</p>` : ''}
    </div>`),
});

const sendBirthdayEmailToUser = (user) => sendEmail({
  to: user.email,
  subject: `🎂 Happy Birthday, ${user.name}!`,
  html: wrap('#ec4899', '🎂 Happy Birthday!', `
    <p>Hi <strong>${user.name}</strong>,</p>
    <p style="font-size:1.1rem">🎉 Wishing you a wonderful birthday! 🎂🎈</p>
    <p>Guardian is here to keep you safe and organized — today and every day.</p>
    <p style="color:#6b7280">Have an amazing day!</p>`),
});

const sendWelcomeEmail = (user) => sendEmail({
  to: user.email,
  subject: '🛡️ Welcome to Guardian!',
  html: wrap('#4f46e5', '🛡️ Welcome to Guardian!', `
    <p>Hi <strong>${user.name}</strong>,</p>
    <p>Welcome to <strong>Guardian</strong> — your personal alert & reminder system!</p>
    <ul style="color:#374151;line-height:1.8">
      <li>✅ Create and manage <strong>tasks</strong></li>
      <li>⏰ Set <strong>reminders</strong> with email alerts</li>
      <li>🔔 Receive <strong>notifications</strong></li>
      <li>📞 Manage <strong>emergency contacts</strong></li>
      <li>🎂 Get <strong>birthday reminders</strong></li>
    </ul>`),
});

module.exports = {
  sendEmail, sendReminderEmail, sendTaskDueEmail,
  sendNotificationEmail, sendWishesEmail,
  sendBirthdayEmailToUser, sendWelcomeEmail,
};
