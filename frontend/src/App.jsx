import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import AdminDashboard from './pages/AdminDashboard';
import OwnerDashboard from './pages/OwnerDashboard';
import EngineerDashboard from './pages/EngineerDashboard';

function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <div className="spinner" style={{ width: 32, height: 32 }} />
    </div>
  );
  if (!user) return <Navigate to="/login" />;
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    console.warn('ProtectedRoute: Role mismatch. User role:', user.role, 'Allowed:', allowedRoles);
    return <Navigate to="/login" />;
  }
  return children;
}

function HomeRedirect() {
  const { user } = useAuth();
  console.log('HomeRedirect: Current user:', user);
  if (!user) {
    console.log('HomeRedirect: No user, going to /login');
    return <Navigate to="/login" />;
  }

  const roleRoutes = {
    admin: '/admin',
    owner: '/owner',
    engineer: '/engineer'
  };

  const target = roleRoutes[user.role];
  if (!target) {
    console.error('HomeRedirect: INVALID ROLE found:', user.role);
    return <Navigate to="/login" />;
  }

  console.log('HomeRedirect: Role', user.role, 'Redirecting to:', target);
  return <Navigate to={target} />;
}

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'var(--bg-base)' }}>
      <div className="spinner" style={{ width: 36, height: 36 }} />
    </div>
  );

  return (
    <Routes>
      <Route path="/" element={<HomeRedirect />} />
      <Route path="/dashboard" element={<HomeRedirect />} />
      <Route path="/login" element={user ? <HomeRedirect /> : <Login />} />
      <Route path="/register" element={user ? <HomeRedirect /> : <Register />} />
      <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>} />
      <Route path="/owner" element={<ProtectedRoute allowedRoles={['owner']}><OwnerDashboard /></ProtectedRoute>} />
      <Route path="/engineer" element={<ProtectedRoute allowedRoles={['engineer']}><EngineerDashboard /></ProtectedRoute>} />
      <Route path="*" element={<HomeRedirect />} />
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
