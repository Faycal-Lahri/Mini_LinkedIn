import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import useAuthStore from './store/authStore';
import Login from './pages/Login';
import Register from './pages/Register';
import Feed from './pages/Feed';
import Network from './pages/Network';
import Profile from './pages/Profile';
import Admin from './pages/Admin';
import Notifications from './pages/Notifications';
import Projects from './pages/Projects';
import Articles from './pages/Articles';
import ChatHub from './pages/ChatHub';
import ProtectedRoute from './components/ProtectedRoute';
import { TopBarLoader } from './components/Loader';
import Toast from './components/Toast';
import ConfirmModal from './components/ConfirmModal';

function AppContent() {
  const { fetchUser } = useAuthStore();
  const location = useLocation();
  const [isNavigating, setIsNavigating] = useState(false);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  useEffect(() => {
    setIsNavigating(true);
    const timeout = setTimeout(() => setIsNavigating(false), 200); // réduit à 200ms
    return () => clearTimeout(timeout);
  }, [location.pathname]);

  return (
    <>
      <TopBarLoader isLoading={isNavigating} />
      <Toast />
      <ConfirmModal />
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected Routes */}
        <Route path="/feed" element={<ProtectedRoute><Feed /></ProtectedRoute>} />
        <Route path="/network" element={<ProtectedRoute><Network /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/profile/:id" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/projects" element={<ProtectedRoute><Projects /></ProtectedRoute>} />
        <Route path="/articles" element={<ProtectedRoute><Articles /></ProtectedRoute>} />
        <Route path="/chat" element={<ProtectedRoute><ChatHub /></ProtectedRoute>} />
        <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
        <Route path="/admin" element={<ProtectedRoute allowedRoles={['ADMIN']}><Admin /></ProtectedRoute>} />

        {/* Redirects */}
        <Route path="/" element={<Navigate to="/feed" replace />} />
        <Route path="*" element={<Navigate to="/feed" replace />} />
      </Routes>
    </>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
