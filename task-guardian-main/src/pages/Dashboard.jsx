import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { dashboardAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const StatCard = ({ icon, label, value, color, to }) => (
  <Link to={to} className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition block">
    <div className="flex items-center justify-between">
      <div><p className="text-sm text-gray-500 mb-1">{label}</p><p className={`text-3xl font-bold ${color}`}>{value ?? '—'}</p></div>
      <span className="text-3xl">{icon}</span>
    </div>
  </Link>
);

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    dashboardAPI.getStats().then(d => setStats(d.data)).catch(e => setError(e.message)).finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Welcome back, {user?.name?.split(' ')[0]} 👋</h1>
        <p className="text-gray-500 mt-1">Here's what's happening today.</p>
      </div>
      {error && <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-6 text-sm">{error}</div>}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array(6).fill(0).map((_, i) => <div key={i} className="bg-white rounded-xl border border-gray-100 p-6 h-28 animate-pulse"><div className="h-4 bg-gray-200 rounded w-1/2 mb-3" /><div className="h-8 bg-gray-200 rounded w-1/4" /></div>)}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <StatCard icon="📋" label="Total Tasks"          value={stats?.totalTasks}           color="text-indigo-600" to="/tasks" />
          <StatCard icon="✅" label="Completed Tasks"      value={stats?.completedTasks}        color="text-green-600"  to="/tasks" />
          <StatCard icon="⏳" label="Pending Tasks"        value={stats?.pendingTasks}          color="text-yellow-600" to="/tasks" />
          <StatCard icon="⏰" label="Active Reminders"     value={stats?.activeReminders}       color="text-blue-600"   to="/reminders" />
          <StatCard icon="🔔" label="Unread Notifications" value={stats?.unreadNotifications}   color="text-red-500"    to="/notifications" />
          <StatCard icon="📞" label="Emergency Contacts"   value={stats?.emergencyContacts}     color="text-purple-600" to="/emergency-contacts" />
        </div>
      )}
      <div className="mt-10 bg-indigo-50 border border-indigo-100 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-indigo-800 mb-2">📧 Email Notifications Active</h2>
        <p className="text-sm text-indigo-600">Guardian automatically sends email reminders, task due alerts, and birthday wishes!</p>
      </div>
    </div>
  );
};
export default Dashboard;
