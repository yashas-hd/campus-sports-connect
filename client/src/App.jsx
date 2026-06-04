import { Routes, Route, Navigate } from 'react-router-dom';
import { useContext } from 'react';
import AuthContext from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import VerifyOTP from './pages/VerifyOTP';
import Dashboard from './pages/Dashboard';
import EventDetails from './pages/EventDetails';
import Profile from './pages/Profile';
import Analytics from './pages/Analytics';
import { Toaster } from 'react-hot-toast';
import './App.css';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useContext(AuthContext);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!user || !user.token) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

function App() {
  const { user, loading } = useContext(AuthContext);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const isAuthenticated = !!(user && user.token);

  return (
    <>
      <Toaster 
        position="top-right"
        toastOptions={{
          style: {
            background: '#1e293b',
            color: '#f3f4f6',
            border: '1px solid #334155',
          },
          success: {
            iconTheme: {
              primary: '#3b82f6',
              secondary: '#1e293b',
            },
          },
        }}
      />
      <Routes>
        <Route path="/" element={isAuthenticated ? <Navigate to="/dashboard" /> : <Navigate to="/login" />} />
        <Route path="/login" element={isAuthenticated ? <Navigate to="/dashboard" /> : <Login />} />
        <Route path="/register" element={isAuthenticated ? <Navigate to="/dashboard" /> : <Register />} />
        <Route path="/verify-otp" element={<VerifyOTP />} />
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/events/:id" 
          element={
            <ProtectedRoute>
              <EventDetails />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/profile" 
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/analytics" 
          element={
            <ProtectedRoute>
              <Analytics />
            </ProtectedRoute>
          } 
        />
        {/* Catch all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

export default App;
