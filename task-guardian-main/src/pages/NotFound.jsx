import { Link } from 'react-router-dom';
const NotFound = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="text-center">
      <div className="text-7xl mb-4">🛡️</div>
      <h1 className="text-4xl font-bold text-gray-800 mb-2">404</h1>
      <p className="text-gray-500 mb-6">Page not found</p>
      <Link to="/" className="bg-indigo-600 text-white px-6 py-2.5 rounded-lg hover:bg-indigo-700 transition">Go Home</Link>
    </div>
  </div>
);
export default NotFound;
