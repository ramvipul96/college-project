import { Navigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { path: '/', label: 'Dashboard', icon: '📊' },
  { path: '/tasks', label: 'Tasks', icon: '✅' },
  { path: '/reminders', label: 'Reminders', icon: '⏰' },
  { path: '/notifications', label: 'Notifications', icon: '🔔' },
  { path: '/emergency-contacts', label: 'Emergency Contacts', icon: '📞' },
];

const AppLayout = ({ children }) => {
  const { user, loading, logout } = useAuth();
  const { pathname } = useLocation();
  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-500">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return (
    <div className="flex min-h-screen bg-gray-50">
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center gap-2"><span className="text-2xl">🛡️</span><span className="text-xl font-bold text-indigo-600">Guardian</span></div>
          <p className="text-xs text-gray-500 mt-1">Personal Alert System</p>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map(({ path, label, icon }) => (
            <Link key={path} to={path} className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition ${pathname === path ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800'}`}>
              <span>{icon}</span>{label}
            </Link>
          ))}
          {user.role === 'admin' && (
            <Link to="/admin" className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition mt-4 ${pathname.startsWith('/admin') ? 'bg-purple-50 text-purple-700' : 'text-gray-600 hover:bg-gray-50'}`}>
              <span>⚙️</span> Admin Panel
            </Link>
          )}
        </nav>
        <div className="p-4 border-t border-gray-100">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm">{user.name?.[0]?.toUpperCase()}</div>
            <div className="overflow-hidden">
              <p className="text-sm font-medium text-gray-800 truncate">{user.name}</p>
              <p className="text-xs text-gray-500 truncate">{user.email}</p>
            </div>
          </div>
          <button onClick={logout} className="w-full text-sm text-red-500 hover:text-red-700 hover:bg-red-50 py-2 rounded-lg transition">Sign Out</button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto p-8">{children}</main>
    </div>
  );
};
export default AppLayout;
