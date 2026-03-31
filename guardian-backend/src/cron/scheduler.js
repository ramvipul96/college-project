const cron = require('node-cron');
const Reminder = require('../models/Reminder');
const Task = require('../models/Task');
const User = require('../models/User');
const EmergencyContact = require('../models/EmergencyContact');
const {
  sendReminderEmail, sendTaskDueEmail,
  sendWishesEmail, sendBirthdayEmailToUser,
} = require('../services/emailService');

// ── Reliable reminder check: 2-min window, retry up to 3 times ───
const checkReminders = async () => {
  try {
    const now = new Date();
    const windowStart = new Date(now.getTime() - 60 * 1000);  // 1 min ago
    const windowEnd   = new Date(now.getTime() + 60 * 1000);  // 1 min ahead

    // Find pending reminders within window OR overdue ones that failed
    const dueReminders = await Reminder.find({
      status: { $in: ['pending', 'failed'] },
      retryCount: { $lt: 3 },
      isActive: true,
      $or: [
        { scheduledAt: { $gte: windowStart, $lte: windowEnd } },
        // Also catch overdue ones missed (up to 30 mins ago)
        { scheduledAt: { $gte: new Date(now.getTime() - 30 * 60 * 1000), $lt: windowStart } },
      ],
    }).populate('user');

    for (const reminder of dueReminders) {
      if (!reminder.user?.email) continue;
      try {
        await sendReminderEmail(reminder.user, reminder);
        reminder.status    = 'sent';
        reminder.emailSent = true;
        reminder.sentAt    = new Date();
        console.log(`✅ Reminder sent: "${reminder.title}" → ${reminder.user.email}`);

        // Handle repeat — schedule next occurrence
        if (reminder.repeat !== 'none') {
          const next = new Date(reminder.scheduledAt);
          if (reminder.repeat === 'daily')   next.setDate(next.getDate() + 1);
          if (reminder.repeat === 'weekly')  next.setDate(next.getDate() + 7);
          if (reminder.repeat === 'monthly') next.setMonth(next.getMonth() + 1);
          await Reminder.create({
            user: reminder.user._id,
            title: reminder.title,
            description: reminder.description,
            dateTime: next,
            scheduledAt: next,
            repeat: reminder.repeat,
            isActive: true,
            status: 'pending',
          });
        }
      } catch (err) {
        reminder.status     = 'failed';
        reminder.retryCount = (reminder.retryCount || 0) + 1;
        console.error(`❌ Reminder failed (attempt ${reminder.retryCount}): ${err.message}`);
      }
      await reminder.save();
    }
  } catch (err) {
    console.error('Cron reminder error:', err.message);
  }
};

// ── Task due alert: 1 hour before, only once ──────────────────────
const checkTasksDue = async () => {
  try {
    const now         = new Date();
    const from        = new Date(now.getTime() + 50 * 60 * 1000);  // 50 min ahead
    const to          = new Date(now.getTime() + 70 * 60 * 1000);  // 70 min ahead

    const dueTasks = await Task.find({
      dueDate:   { $gte: from, $lte: to },
      emailSent: false,
      status:    { $ne: 'completed' },
    }).populate('user');

    for (const task of dueTasks) {
      if (!task.user?.email) continue;
      try {
        await sendTaskDueEmail(task.user, task);
        task.emailSent   = true;
        task.emailSentAt = new Date();
        await task.save();
        console.log(`✅ Task due email: "${task.title}" → ${task.user.email}`);
      } catch (err) {
        console.error(`❌ Task email failed: ${err.message}`);
      }
    }
  } catch (err) {
    console.error('Cron task error:', err.message);
  }
};

// ── Birthday: check contacts AND user's own birthday at 8 AM ─────
const checkBirthdays = async () => {
  try {
    const now   = new Date();
    const month = now.getMonth() + 1;
    const day   = now.getDate();
    const year  = now.getFullYear();

    // 1. Emergency contact birthdays
    const contacts = await EmergencyContact.find({
      birthdayMonth: month,
      birthdayDay:   day,
      $or: [
        { birthdayEmailSentYear: { $exists: false } },
        { birthdayEmailSentYear: { $lt: year } },
      ],
    }).populate('user');

    for (const contact of contacts) {
      if (!contact.user?.email) continue;
      try {
        await sendWishesEmail(contact.user, contact);
        contact.birthdayEmailSentYear = year;
        await contact.save();
        console.log(`🎂 Birthday wish sent for ${contact.name} → ${contact.user.email}`);
      } catch (err) {
        console.error(`❌ Birthday wish failed: ${err.message}`);
      }
    }

    // 2. User's own birthday
    const birthdayUsers = await User.find({
      birthdayMonth: month,
      birthdayDay:   day,
      $or: [
        { birthdayEmailSentYear: { $exists: false } },
        { birthdayEmailSentYear: { $lt: year } },
      ],
    });

    for (const user of birthdayUsers) {
      try {
        await sendBirthdayEmailToUser(user);
        user.birthdayEmailSentYear = year;
        await user.save();
        console.log(`🎂 Own birthday email sent to ${user.email}`);
      } catch (err) {
        console.error(`❌ Own birthday email failed: ${err.message}`);
      }
    }
  } catch (err) {
    console.error('Cron birthday error:', err.message);
  }
};

const initCronJobs = () => {
  // Every minute — reminders
  cron.schedule('* * * * *', checkReminders);
  console.log('⏰ Reminder cron started (every minute, 2-min window, retry x3)');

  // Every 10 minutes — task due alerts
  cron.schedule('*/10 * * * *', checkTasksDue);
  console.log('📋 Task cron started (every 10 min, alerts 1hr before due)');

  // Daily at 8 AM — birthdays
  cron.schedule('0 8 * * *', checkBirthdays);
  console.log('🎂 Birthday cron started (daily 8 AM, own + contacts)');
};

module.exports = { initCronJobs };
