import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Landing from './pages/Landing';
import DispatcherLogin from './pages/DispatcherLogin';
import DriverLogin from './pages/DriverLogin';
import DispatcherDashboard from './pages/DispatcherDashboard';
import DriverDashboard from './pages/DriverDashboard';
import CustomerTracking from './pages/CustomerTracking';
import Reports from './pages/Reports';

function Guard({ children, role }: { children: React.ReactNode; role: string }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
    </div>
  );
  if (!user) return <Navigate to="/" replace />;
  if (user.role !== role) return <Navigate to={user.role === 'DISPATCHER' ? '/dispatcher' : '/driver'} replace />;
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login/dispatcher" element={<DispatcherLogin />} />
      <Route path="/login/driver" element={<DriverLogin />} />
      <Route path="/track" element={<CustomerTracking />} />
      <Route path="/dispatcher" element={<Guard role="DISPATCHER"><DispatcherDashboard /></Guard>} />
      <Route path="/reports" element={<Guard role="DISPATCHER"><Reports /></Guard>} />
      <Route path="/driver" element={<Guard role="DRIVER"><DriverDashboard /></Guard>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
