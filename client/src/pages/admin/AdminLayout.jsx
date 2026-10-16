import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';

export default function AdminLayout() {
  const { user } = useAuth();
  const tab = ({ isActive }) => `sort${isActive ? ' is-on' : ''}`;
  return (
    <div className="shell admin">
      <header className="feed-head">
        <h1>Newsroom</h1>
        <nav className="sorts" aria-label="Newsroom sections">
          <NavLink to="/admin" end className={tab}>Overview</NavLink>
          <NavLink to="/admin/newsroom" className={tab}>Stories</NavLink>
          <NavLink to="/admin/moderation" className={tab}>Moderation</NavLink>
          {user?.capabilities?.manageMembers && <NavLink to="/admin/members" className={tab}>Members</NavLink>}
        </nav>
      </header>
      <Outlet />
    </div>
  );
}
