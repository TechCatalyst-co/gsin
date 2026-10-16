import { Link } from 'react-router-dom';
import { BRAND, CATEGORIES } from '../brand';
import Wordmark from './Wordmark';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="shell footer-grid">
        <div>
          <Wordmark />
          <p className="footer-tagline">{BRAND.tagline}</p>
          <p className="footer-fine">Stories are gathered from public sources and summarized by our automated newsroom, then curated by editors. Always check the original source.</p>
        </div>
        <nav aria-label="Topics">
          <h2 className="footer-head">Topics</h2>
          <ul>{CATEGORIES.map((c) => <li key={c.slug}><Link to={`/topic/${c.slug}`}>{c.name}</Link></li>)}</ul>
        </nav>
        <nav aria-label="More">
          <h2 className="footer-head">More</h2>
          <ul>
            <li><Link to="/brief">Daily Brief</Link></li>
            <li><Link to="/premium">Premium</Link></li>
            <li><a href="/api/v1/public/rss">RSS feed</a></li>
            <li><Link to="/privacy">Privacy</Link></li>
            <li><Link to="/terms">Terms</Link></li>
            <li><Link to="/delete-account">Delete account</Link></li>
          </ul>
        </nav>
      </div>
      <div className="shell footer-copy">© {new Date().getFullYear()} {BRAND.name}</div>
    </footer>
  );
}
