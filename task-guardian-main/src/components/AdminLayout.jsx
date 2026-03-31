import { Navigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const adminNav = [
  { path: '/admin', label: 'Dashboard', icon: '📊' },
  { path: '/admin/users', label: 'Users', icon: '👥' },
  { path: '/admin/alerts', label: 'Alerts', icon: '🔔' },
  { path: '/admin/settings', label: 'Settings', icon: '⚙️' },
];

const AdminLayout = ({ children }) => {
  const { user, loading, logout } = useAuth();
  const { pathname } = useLocation();
  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (!user || user.role !== 'admin') return <Navigate to="/" replace />;
  return (
    <div className="flex min-h-screen bg-gray-50">
      <aside className="w-64 bg-purple-900 text-white flex flex-col">
        <div className="p-6 border-b border-purple-800">
          <div className="flex items-center gap-2"><span className="text-2xl">🛡️</span><span className="text-xl font-bold">Guardian</span></div>
          <span className="text-xs text-purple-300 mt-1 block">Admin Panel</span>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {adminNav.map(({ path, label, icon }) => (
            <Link key={path} to={path} className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition ${pathname === path ? 'bg-purple-700 text-white' : 'text-purple-200 hover:bg-purple-800'}`}>
              <span>{icon}</span>{label}
            </Link>
          ))}
          <Link to="/" className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm text-purple-300 hover:bg-purple-800 mt-4">← Back to App</Link>
        </nav>
        <div className="p-4 border-t border-purple-800">
          <p className="text-sm text-purple-200 truncate">{user.name}</p>
          <button onClick={logout} className="text-xs text-purple-400 hover:text-red-300 mt-1 transition">Sign Out</button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto p-8">{children}</main>
    </div>
  );
};
export default AdminLayout;
