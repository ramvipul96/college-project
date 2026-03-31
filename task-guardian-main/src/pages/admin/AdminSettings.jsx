const AdminSettings = () => (
  <div>
    <h1 className="text-2xl font-bold text-gray-800 mb-6">Settings</h1>
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
      <h2 className="font-semibold text-gray-800 mb-4">Email Configuration (set in .env)</h2>
      <div className="space-y-3 text-sm text-gray-600">
        {['EMAIL_HOST','EMAIL_PORT','EMAIL_USER','EMAIL_PASS','EMAIL_FROM'].map(k => (
          <div key={k} className="flex items-center gap-3 bg-gray-50 px-4 py-2.5 rounded-lg font-mono">
            <span className="text-indigo-600">{k}</span>
            <span className="text-gray-400">— set in guardian-backend/.env</span>
          </div>
        ))}
      </div>
      <p className="text-xs text-gray-400 mt-4">Use a Gmail App Password. Enable 2FA first, then generate an App Password from Google account security settings.</p>
    </div>
  </div>
);
export default AdminSettings;
