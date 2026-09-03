// src/App.tsx
import { Routes, Route, BrowserRouter as Router, Navigate } from 'react-router-dom';
import LoginPage from './pages/Auth/LoginPage';
// import RegisterPage from './pages/Auth/RegisterPage';
import { AuthProvider, useAuth } from './context/AuthContext';
import './App.css';
import type { JSX } from 'react';
import Dashboard from './pages/Admin/Dashboard';
import NotFoundPage from './pages/NotFound/NotFoundPage';

const ProtectedRoute = ({ children, role }: { children: JSX.Element; role?: string }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" />;
  if (role && user.role !== role && !(role === 'ADMIN/HR' && (user.role === 'ADMIN' || user.role === 'HR'))) {
    return <Navigate to="/login" />;
  }
  return children;
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/Admin-FE/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<LoginPage />} />
          {/* <Route path="/register" element={<RegisterPage />} /> */}

          {/* Admin / HR Dashboard */}
          <Route
            path="/admin/*"
            element={
              <ProtectedRoute role="ADMIN/HR">
                <Dashboard />
              </ProtectedRoute>
            }
          />

          {/* Employee Dashboard
          <Route
            path="/employee/*"
            element={
              <ProtectedRoute role="EMPLOYEE">
                <EmployeeDashboard />
              </ProtectedRoute>
            }
          /> */}

          <Route path="*" element={<NotFoundPage /> }/>
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
