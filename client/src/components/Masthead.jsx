import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { BRAND, NAV } from '../brand';
import Wordmark from './Wordmark';
import ThemeToggle from './ThemeToggle';

// One bar: the brand, three sections, search and the account. Topics live on the News page.
// On phones the sections, search and account fold into the menu.
export default function Masthead() {
  const { user } = useAuth();
  const nav = useNavigate();
  const { pathname } = useLocation();
  const [q, setQ] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => setMenuOpen(false), [pathname]);

  const search = (e) => {
    e.preventDefault();
    if (q.trim()) nav(`/search?q=${encodeURIComponent(q.trim())}`);
  };

  const account = user ? (
    <>
      {user.capabilities?.curate && <NavLink to="/admin" className="link">Admin</NavLink>}
      <NavLink to="/account" className="link">Account</NavLink>
    </>
  ) : (
    <>
      <NavLink to="/login" className="link">Sign in</NavLink>
      <Link to="/register" className="btn primary sm">Join free</Link>
    </>
  );

  return (
    <header className="masthead">
      <div className="masthead-top shell">
        <Link to="/" className="masthead-brand" aria-label={`${BRAND.name} home`}><Wordmark /></Link>
        <nav className="primary-nav" aria-label="Sections">
          {NAV.map((n) => <NavLink key={n.to} to={n.to}>{n.label}</NavLink>)}
        </nav>
        <form className="masthead-search" onSubmit={search} role="search">
          <input type="search" placeholder="Search" aria-label="Search stories" value={q} onChange={(e) => setQ(e.target.value)} />
        </form>
        <div className="masthead-account">{account}</div>
        <ThemeToggle />
        <button className="masthead-menu" aria-expanded={menuOpen} aria-controls="site-menu" onClick={() => setMenuOpen((o) => !o)}>
          {menuOpen ? 'Close' : 'Menu'}
        </button>
      </div>
      <nav id="site-menu" className={`desks${menuOpen ? ' open' : ''}`} aria-label="Menu">
        <div className="shell desks-row">
          {NAV.map((n) => <NavLink key={n.to} to={n.to} className="desk">{n.label}</NavLink>)}
          <form className="desks-search" onSubmit={search} role="search">
            <input type="search" placeholder="Search stories" aria-label="Search stories" value={q} onChange={(e) => setQ(e.target.value)} />
          </form>
          <div className="desks-account">{account}</div>
        </div>
      </nav>
    </header>
  );
}
