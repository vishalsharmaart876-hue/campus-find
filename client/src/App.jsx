import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { LanguageProvider } from './context/LanguageContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';

// Common Components
import Navbar from './components/common/Navbar';
import Footer from './components/common/Footer';
import CampusLiveToast from './components/common/CampusLiveToast';

// Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import BrowseItemsPage from './pages/BrowseItemsPage';
import ItemDetailsPage from './pages/ItemDetailsPage';
import ReportLostPage from './pages/ReportLostPage';
import ReportFoundPage from './pages/ReportFoundPage';
import StudentDashboardPage from './pages/StudentDashboardPage';
import MyReportsPage from './pages/MyReportsPage';
import NotificationsPage from './pages/NotificationsPage';
import MessagingPage from './pages/MessagingPage';
import CampusMapPage from './pages/CampusMapPage';
import UserProfilePage from './pages/UserProfilePage';
import EmergencyIdPage from './pages/EmergencyIdPage';
import LeaderboardPage from './pages/LeaderboardPage';
import AboutContactPage from './pages/AboutContactPage';
import NotFoundPage from './pages/NotFoundPage';

// Admin Pages
import AdminLayout from './pages/admin/AdminLayout';
import AdminOverviewPage from './pages/admin/AdminOverviewPage';
import AdminUsersPage from './pages/admin/AdminUsersPage';
import AdminLoginLogsPage from './pages/admin/AdminLoginLogsPage';
import AdminReportsPage from './pages/admin/AdminReportsPage';
import AdminClaimsPage from './pages/admin/AdminClaimsPage';
import AdminCampusLocationsPage from './pages/admin/AdminCampusLocationsPage';

// Member Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-xs text-slate-400">
        Loading session...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

// Admin Protected Route Component - Accessible exclusively to authorized campus admins
const AdminRoute = ({ children }) => {
  const { isAuthenticated, isAdmin, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-xs text-slate-400">
        Verifying administrator credentials...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};


function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>
          <SocketProvider>
            <BrowserRouter>
              <div className="flex flex-col min-h-screen">
                <Navbar />
                <CampusLiveToast />
                <main className="flex-1">
                  <Routes>
                    {/* Public Pages */}
                    <Route path="/" element={<LandingPage />} />
                    <Route path="/browse" element={<BrowseItemsPage />} />
                    <Route path="/items/:id" element={<ItemDetailsPage />} />
                    <Route path="/map" element={<CampusMapPage />} />
                    <Route path="/leaderboard" element={<LeaderboardPage />} />
                    <Route path="/emergency-id" element={<EmergencyIdPage />} />
                    <Route path="/about" element={<AboutContactPage />} />

                    {/* Auth Pages */}
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/signup" element={<SignupPage />} />
                    <Route path="/forgot-password" element={<ForgotPasswordPage />} />

                    {/* Member Protected Pages */}
                    <Route
                      path="/dashboard"
                      element={
                        <ProtectedRoute>
                          <StudentDashboardPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/report-lost"
                      element={
                        <ProtectedRoute>
                          <ReportLostPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/report-found"
                      element={
                        <ProtectedRoute>
                          <ReportFoundPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/my-reports"
                      element={
                        <ProtectedRoute>
                          <MyReportsPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/notifications"
                      element={
                        <ProtectedRoute>
                          <NotificationsPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/messages"
                      element={
                        <ProtectedRoute>
                          <MessagingPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/profile"
                      element={
                        <ProtectedRoute>
                          <UserProfilePage />
                        </ProtectedRoute>
                      }
                    />

                    {/* Separate Admin Dashboard - Exclusively accessible to authorized admins */}
                    <Route
                      path="/admin"
                      element={
                        <AdminRoute>
                          <AdminLayout />
                        </AdminRoute>
                      }
                    >
                      <Route index element={<AdminOverviewPage />} />
                      <Route path="users" element={<AdminUsersPage />} />
                      <Route path="logs" element={<AdminLoginLogsPage />} />
                      <Route path="reports" element={<AdminReportsPage />} />
                      <Route path="claims" element={<AdminClaimsPage />} />
                      <Route path="locations" element={<AdminCampusLocationsPage />} />
                    </Route>


                    {/* 404 Fallback */}
                    <Route path="*" element={<NotFoundPage />} />
                  </Routes>
                </main>
                <Footer />
              </div>
            </BrowserRouter>
          </SocketProvider>
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}

export default App;
