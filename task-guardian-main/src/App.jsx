import { BrowserRouter, Route, Routes } from "react-router-dom";
import AppLayout from "./components/AppLayout.jsx";
import AdminLayout from "./components/AdminLayout.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Tasks from "./pages/Tasks.jsx";
import Reminders from "./pages/Reminders.jsx";
import Notifications from "./pages/Notifications.jsx";
import EmergencyContacts from "./pages/EmergencyContacts.jsx";
import Profile from "./pages/Profile.jsx";
import Login from "./pages/Login.jsx";
import NotFound from "./pages/NotFound.jsx";
import AdminDashboard from "./pages/admin/AdminDashboard.jsx";
import AdminUsers from "./pages/admin/AdminUsers.jsx";
import AdminAlerts from "./pages/admin/AdminAlerts.jsx";
import AdminSettings from "./pages/admin/AdminSettings.jsx";

const App = () => (
  <BrowserRouter>
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/"                    element={<AppLayout><Dashboard /></AppLayout>} />
      <Route path="/tasks"               element={<AppLayout><Tasks /></AppLayout>} />
      <Route path="/reminders"           element={<AppLayout><Reminders /></AppLayout>} />
      <Route path="/notifications"       element={<AppLayout><Notifications /></AppLayout>} />
      <Route path="/emergency-contacts"  element={<AppLayout><EmergencyContacts /></AppLayout>} />
      <Route path="/profile"             element={<AppLayout><Profile /></AppLayout>} />
      <Route path="/admin"               element={<AdminLayout><AdminDashboard /></AdminLayout>} />
      <Route path="/admin/users"         element={<AdminLayout><AdminUsers /></AdminLayout>} />
      <Route path="/admin/alerts"        element={<AdminLayout><AdminAlerts /></AdminLayout>} />
      <Route path="/admin/settings"      element={<AdminLayout><AdminSettings /></AdminLayout>} />
      <Route path="*"                    element={<NotFound />} />
    </Routes>
  </BrowserRouter>
);

export default App;
