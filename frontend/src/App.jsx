import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute, { PublicOnly } from './components/auth/ProtectedRoute';
import Layout from './components/layout/Layout';
import LoginPage from './pages/auth/LoginPage';
import SignupPage from './pages/auth/SignupPage';
import DashboardPage from './pages/DashboardPage';
import SettingsPage from './pages/SettingsPage';
import {
  EnvironmentalPage,
  SocialPage,
  GovernancePage,
  GamificationPage,
  ReportsPage,
  NotFoundPage,
} from './pages/modules';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<PublicOnly><LoginPage /></PublicOnly>} />
      <Route path="/signup" element={<PublicOnly><SignupPage /></PublicOnly>} />

      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/environmental" element={<EnvironmentalPage />} />
        <Route path="/social" element={<SocialPage />} />
        <Route path="/governance" element={<GovernancePage />} />
        <Route path="/gamification" element={<GamificationPage />} />
        <Route
          path="/reports"
          element={
            <ProtectedRoute roles={['ADMIN', 'MANAGER']}>
              <ReportsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute roles={['ADMIN']}>
              <SettingsPage />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<NotFoundPage />} />
      </Route>

      <Route path="/" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
