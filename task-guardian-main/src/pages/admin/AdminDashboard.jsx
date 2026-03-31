import { useEffect, useState } from 'react';
import { adminAPI } from '../../services/api';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => { adminAPI.getStats().then(d => setStats(d.data)).catch(e => setError(e.message)).finally(() => setLoading(false)); }, []);
  const cards = [{ label:'Total Users', value:stats?.userCount, icon:'👥', color:'text-indigo-600' }, { label:'Total Tasks', value:stats?.taskCount, icon:'✅', color:'text-green-600' }, { label:'Total Reminders', value:stats?.reminderCount, icon:'⏰', color:'text-blue-600' }];
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Admin Dashboard</h1>
      {error && <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-4 text-sm">{error}</div>}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {cards.map(({ label, value, icon, color }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-6"><div className="flex justify-between items-center"><div><p className="text-sm text-gray-500">{label}</p><p className={`text-3xl font-bold mt-1 ${color}`}>{loading ? '—' : value}</p></div><span className="text-3xl">{icon}</span></div></div>
        ))}
      </div>
    </div>
  );
};
export default AdminDashboard;
