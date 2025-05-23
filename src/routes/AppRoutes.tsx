import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

// Layouts
import AuthLayout from '../layouts/AuthLayout';
import DashboardLayout from '../layouts/DashboardLayout';

// Auth Pages
import LoginPage from '../pages/auth/LoginPage';

// Admin Pages
import AdminDashboard from '../pages/admin/AdminDashboard';
import AdminLeads from '../pages/admin/AdminLeads';
import AdminReports from '../pages/admin/AdminReports';
import AdminCalendar from '../pages/admin/AdminCalendar';

// BDA Pages
import BdaDashboard from '../pages/bda/BdaDashboard';
import BdaLeads from '../pages/bda/BdaLeads';
import BdaCalendar from '../pages/bda/BdaCalendar';

// Protected route wrapper component
interface ProtectedRouteProps {
  children: JSX.Element;
  requiredRole?: 'admin' | 'bda' | 'any';
}

const ProtectedRoute = ({ children, requiredRole = 'any' }: ProtectedRouteProps) => {
  const { isAuthenticated, isAdmin, isBDA } = useAuth();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  if (requiredRole === 'admin' && !isAdmin) {
    return <Navigate to="/bda/dashboard" replace />;
  }
  
  if (requiredRole === 'bda' && !isBDA) {
    return <Navigate to="/admin/dashboard" replace />;
  }
  
  return children;
};

const AppRoutes = () => {
  const { isAuthenticated, isAdmin } = useAuth();
  
  return (
    <Routes>
      {/* Redirect from root based on auth status */}
      <Route 
        path="/" 
        element={
          isAuthenticated 
            ? <Navigate to={isAdmin ? "/admin/dashboard" : "/bda/dashboard"} replace /> 
            : <Navigate to="/login" replace />
        } 
      />
      
      {/* Auth routes */}
      <Route path="/login" element={
        <AuthLayout>
          <LoginPage />
        </AuthLayout>
      } />
      
      {/* Admin routes */}
      <Route path="/admin/dashboard" element={
        <ProtectedRoute requiredRole="admin">
          <DashboardLayout>
            <AdminDashboard />
          </DashboardLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/admin/leads" element={
        <ProtectedRoute requiredRole="admin">
          <DashboardLayout>
            <AdminLeads />
          </DashboardLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/admin/reports" element={
        <ProtectedRoute requiredRole="admin">
          <DashboardLayout>
            <AdminReports />
          </DashboardLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/admin/calendar" element={
        <ProtectedRoute requiredRole="admin">
          <DashboardLayout>
            <AdminCalendar />
          </DashboardLayout>
        </ProtectedRoute>
      } />
      
      {/* BDA routes */}
      <Route path="/bda/dashboard" element={
        <ProtectedRoute requiredRole="bda">
          <DashboardLayout>
            <BdaDashboard />
          </DashboardLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/bda/leads" element={
        <ProtectedRoute requiredRole="bda">
          <DashboardLayout>
            <BdaLeads />
          </DashboardLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/bda/calendar" element={
        <ProtectedRoute requiredRole="bda">
          <DashboardLayout>
            <BdaCalendar />
          </DashboardLayout>
        </ProtectedRoute>
      } />
      
      {/* Catch-all route */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRoutes;