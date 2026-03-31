const AdminAlerts = () => (
  <div>
    <h1 className="text-2xl font-bold text-gray-800 mb-6">System Alerts</h1>
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-4">
      {[
        { icon:'✅', label:'Reminder cron',     desc:'Runs every minute — sends emails for due reminders' },
        { icon:'✅', label:'Task due cron',      desc:'Runs every 10 minutes — alerts 1 hour before due date' },
        { icon:'✅', label:'Birthday cron',      desc:'Runs daily at 8 AM — sends birthday wish emails' },
        { icon:'✅', label:'Welcome email',      desc:'Sent immediately on user registration' },
        { icon:'✅', label:'Notification email', desc:'Sent immediately when a notification is created' },
      ].map(({ icon, label, desc }) => (
        <div key={label} className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
          <span className="text-xl text-green-600">{icon}</span>
          <div><p className="font-medium text-gray-800">{label}</p><p className="text-sm text-gray-500">{desc}</p></div>
        </div>
      ))}
    </div>
  </div>
);
export default AdminAlerts;
