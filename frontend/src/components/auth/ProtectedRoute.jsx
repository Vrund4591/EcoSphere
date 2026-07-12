import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

// Auth requires BOTH the store flag AND an actual token in localStorage.
// This prevents a stale persisted `isAuthenticated: true` (with no token) from
// looping between /login and /dashboard.
const hasToken = () => !!localStorage.getItem('token');

export default function ProtectedRoute({ children, roles }) {
  const { isAuthenticated, user } = useAuthStore();
  const location = useLocation();

  if (!isAuthenticated || !hasToken()) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  if (roles && roles.length > 0 && !roles.includes(user?.role)) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
}

export function PublicOnly({ children }) {
  const { isAuthenticated } = useAuthStore();
  if (isAuthenticated && hasToken()) return <Navigate to="/dashboard" replace />;
  return children;
}
