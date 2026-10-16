import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

const Loading = () => <div className="center muted">Loading…</div>;

// `state.from` lets Login return the reader to the page they wanted.
export function RequireAuth({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <Loading />;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (user.mustChangePassword && location.pathname !== '/change-password') return <Navigate to="/change-password" replace />;
  return children;
}

export function RequireStaff({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <Loading />;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (user.mustChangePassword) return <Navigate to="/change-password" replace />;
  if (!user.capabilities?.curate) return <Navigate to="/" replace />;
  return children;
}
