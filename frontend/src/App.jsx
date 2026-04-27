import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ChatProvider } from './context/ChatContext';
import { ThemeProvider } from './context/ThemeContext';
import AuthPage from './components/AuthPage';
import Dashboard from './components/Dashboard';
import Chat from './components/Chat';
import Connect from './components/Connect';
import StudyGroups from './components/StudyGroups';
import Events from './components/Events';
import Achievements from './components/Achievements';
import Notifications from './components/Notifications';
import Settings from './components/Settings';
import Profile from './components/Profile';
import ProtectedRoute from './components/ProtectedRoute';
import MainLayout from './components/MainLayout';
import './App.css';

import { StoryProvider } from './context/StoryContext';
import { ToastProvider } from './context/ToastContext';
import './context/Toast.css';

function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <ToastProvider>
          <ChatProvider>
            <StoryProvider>
            <Router>
              <Routes>
                <Route path="/" element={<AuthPage />} />
                <Route path="/login" element={<AuthPage />} />

                {/* Protected Routes with MainLayout */}
                <Route path="/dashboard" element={
                  <ProtectedRoute>
                    <MainLayout><Dashboard /></MainLayout>
                  </ProtectedRoute>
                } />
                <Route path="/chat" element={
                  <ProtectedRoute>
                    <MainLayout><Chat /></MainLayout>
                  </ProtectedRoute>
                } />
                <Route path="/connect" element={
                  <ProtectedRoute>
                    <MainLayout><Connect /></MainLayout>
                  </ProtectedRoute>
                } />
                <Route path="/groups" element={
                  <ProtectedRoute>
                    <MainLayout><StudyGroups /></MainLayout>
                  </ProtectedRoute>
                } />
                <Route path="/events" element={
                  <ProtectedRoute>
                    <MainLayout><Events /></MainLayout>
                  </ProtectedRoute>
                } />
                <Route path="/achievements" element={
                  <ProtectedRoute>
                    <MainLayout><Achievements /></MainLayout>
                  </ProtectedRoute>
                } />
                <Route path="/notifications" element={
                  <ProtectedRoute>
                    <MainLayout><Notifications /></MainLayout>
                  </ProtectedRoute>
                } />
                <Route path="/settings" element={
                  <ProtectedRoute>
                    <MainLayout><Settings /></MainLayout>
                  </ProtectedRoute>
                } />
                <Route path="/profile/:id?" element={
                  <ProtectedRoute>
                    <MainLayout><Profile /></MainLayout>
                  </ProtectedRoute>
                } />

                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Router>
          </StoryProvider>
        </ChatProvider>
      </ToastProvider>
    </ThemeProvider>
  </AuthProvider>
  );
}

export default App;
