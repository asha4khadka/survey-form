import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { Login } from './pages/Auth/Login';
import { Register } from './pages/Auth/Register';
import { Dashboard } from './pages/Admin/Dashboard';
import { SurveyBuilder } from './pages/Admin/SurveyBuilder';
import { SurveyAnalytics } from './pages/Admin/SurveyAnalytics';
import { PublicSurveyView } from './pages/Public/PublicSurveyView';

// Protected Route Guard
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

// Main Layout Wrapper
const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const isPublicSurvey = location.pathname.startsWith('/survey/');

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {!isPublicSurvey && <Navbar />}
      <main className="flex-1">{children}</main>
      {!isPublicSurvey && <Footer />}
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppLayout>
          <Routes>
            {/* Landing redirect */}
            <Route path="/" element={<Navigate to="/admin" replace />} />

            {/* Auth Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Admin Protected Routes */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/surveys/new"
              element={
                <ProtectedRoute>
                  <SurveyBuilder />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/surveys/:id/edit"
              element={
                <ProtectedRoute>
                  <SurveyBuilder />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/surveys/:id/analytics"
              element={
                <ProtectedRoute>
                  <SurveyAnalytics />
                </ProtectedRoute>
              }
            />

            {/* Public Respondent Survey Route */}
            <Route path="/survey/:id" element={<PublicSurveyView />} />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/admin" replace />} />
          </Routes>
        </AppLayout>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
