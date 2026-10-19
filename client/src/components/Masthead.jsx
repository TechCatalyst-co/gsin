import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { BRAND, CATEGORIES, NAV } from '../brand';
import Wordmark from './Wordmark';
import ThemeToggle from './ThemeToggle';

export default function Masthead() {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const { pathname } = useLocation();
  const [q, setQ] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => setMenuOpen(false), [pathname]);

  const search = (e) => {
    e.preventDefault();
    if (q.trim()) nav(`/search?q=${encodeURIComponent(q.trim())}`);
  };

  return (
    <header className="masthead">
      <div className="masthead-top shell">
        <Link to="/" className="masthead-brand" aria-label={`${BRAND.name} home`}><Wordmark /></Link>
        <nav className="primary-nav" aria-label="Sections">
          {NAV.map((n) => <NavLink key={n.to} to={n.to} end={n.end}>{n.label}</NavLink>)}
        </nav>
        <form className="masthead-search" onSubmit={search} role="search">
          <input type="search" placeholder="Search stories" aria-label="Search stories" value={q} onChange={(e) => setQ(e.target.value)} />
        </form>
        <div className="masthead-account">
          {user ? (
            <>
              {user.capabilities?.curate && <NavLink to="/admin" className="link">Admin</NavLink>}
              <NavLink to="/saved" className="link">Saved</NavLink>
              <NavLink to="/account" className="link">Account</NavLink>
              <button className="link" onClick={async () => { await logout(); nav('/'); }}>Sign out</button>
            </>
          ) : (
            <>
              <NavLink to="/login" className="link">Sign in</NavLink>
              <Link to="/register" className="btn primary sm">Join free</Link>
            </>
          )}
        </div>
        <ThemeToggle />
        <button className="masthead-menu" aria-expanded={menuOpen} aria-controls="desk-nav" onClick={() => setMenuOpen((o) => !o)}>
          {menuOpen ? 'Close' : 'Menu'}
        </button>
      </div>
      <nav id="desk-nav" className={`desks${menuOpen ? ' open' : ''}`} aria-label="Desks">
        <div className="shell desks-row">
          <NavLink to="/" end className="desk">All signal</NavLink>
          <NavLink to="/intelligence" className="desk desk--brief">Briefs</NavLink>
          <NavLink to="/watchlist" className="desk mobile-only">Watchlist</NavLink>
          <NavLink to="/research" className="desk mobile-only">Research</NavLink>
          {CATEGORIES.map((c) => (
            <NavLink key={c.slug} to={`/topic/${c.slug}`} className="desk">{c.short}</NavLink>
          ))}
          <form className="desks-search" onSubmit={search} role="search">
            <input type="search" placeholder="Search stories" aria-label="Search stories" value={q} onChange={(e) => setQ(e.target.value)} />
          </form>
          <div className="desks-account">
            {user ? (
              <>
                {user.capabilities?.curate && <Link to="/admin">Admin</Link>}
                <Link to="/saved">Saved</Link>
                <Link to="/account">Account</Link>
                <button className="link" onClick={async () => { await logout(); nav('/'); }}>Sign out</button>
              </>
            ) : (
              <Link to="/login">Sign in</Link>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
}
