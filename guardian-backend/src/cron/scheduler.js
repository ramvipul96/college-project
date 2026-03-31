const cron = require('node-cron');
const Reminder = require('../models/Reminder');
const Task = require('../models/Task');
const EmergencyContact = require('../models/EmergencyContact');
const { sendReminderEmail, sendTaskDueEmail, sendWishesEmail } = require('../services/emailService');

const checkReminders = async () => {
  try {
    const now = new Date();
    const windowEnd = new Date(now.getTime() + 60 * 1000);
    const dueReminders = await Reminder.find({ dateTime: { $gte: now, $lte: windowEnd }, emailSent: false, isActive: true }).populate('user');
    for (const reminder of dueReminders) {
      if (reminder.user?.email) {
        await sendReminderEmail(reminder.user, reminder);
        reminder.emailSent = true;
        await reminder.save();
        console.log(`📧 Reminder email sent: "${reminder.title}" → ${reminder.user.email}`);
      }
    }
  } catch (err) { console.error('Cron reminder error:', err.message); }
};

const checkTasksDue = async () => {
  try {
    const now = new Date();
    const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);
    const tenMinsLater = new Date(now.getTime() + 10 * 60 * 1000);
    const dueTasks = await Task.find({ dueDate: { $gte: tenMinsLater, $lte: oneHourLater }, emailSent: false, status: { $ne: 'completed' } }).populate('user');
    for (const task of dueTasks) {
      if (task.user?.email) {
        await sendTaskDueEmail(task.user, task);
        task.emailSent = true;
        await task.save();
        console.log(`📧 Task due email sent: "${task.title}" → ${task.user.email}`);
      }
    }
  } catch (err) { console.error('Cron task error:', err.message); }
};

const checkBirthdays = async () => {
  try {
    const now = new Date();
    const contacts = await EmergencyContact.find({ birthdayMonth: now.getMonth() + 1, birthdayDay: now.getDate() }).populate('user');
    for (const contact of contacts) {
      if (contact.user?.email) {
        await sendWishesEmail(contact.user, contact);
        console.log(`🎂 Birthday wish sent for ${contact.name} → ${contact.user.email}`);
      }
    }
  } catch (err) { console.error('Cron birthday error:', err.message); }
};

const initCronJobs = () => {
  cron.schedule('* * * * *', checkReminders);
  console.log('⏰ Reminder cron job started (every minute)');
  cron.schedule('*/10 * * * *', checkTasksDue);
  console.log('📋 Task due cron job started (every 10 minutes)');
  cron.schedule('0 8 * * *', checkBirthdays);
  console.log('🎂 Birthday cron job started (daily at 8 AM)');
};

module.exports = { initCronJobs };
