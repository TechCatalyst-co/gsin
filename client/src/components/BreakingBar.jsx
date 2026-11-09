import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { storyPath, timeAgo } from '../format';

const POLL_MS = 2 * 60 * 1000;

// The breaking ticker under the masthead: urgent stories from the last 24
// hours, scrolling. It renders nothing while nothing is breaking. Hover or
// focus pauses it; with reduced motion it is a static, wrapped list.
export default function BreakingBar() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    let alive = true;
    const pull = () => {
      if (document.visibilityState === 'hidden') return;
      api('/news?urgent=true&hours=24&sort=latest&limit=5')
        .then((d) => alive && setItems(d.items || []))
        .catch(() => { /* keep the last reading */ });
    };
    pull();
    const timer = setInterval(pull, POLL_MS);
    document.addEventListener('visibilitychange', pull);
    return () => {
      alive = false;
      clearInterval(timer);
      document.removeEventListener('visibilitychange', pull);
    };
  }, []);

  if (!items.length) return null;

  const row = (copy) => items.map((i) => (
    <li key={`${copy}-${i._id}`} aria-hidden={copy ? 'true' : undefined}>
      <Link to={storyPath(i)} tabIndex={copy ? -1 : undefined}>{i.title}</Link>
      <span className="breaking-time">{timeAgo(i.published)}</span>
    </li>
  ));

  // Roughly constant reading speed however many headlines there are.
  const chars = items.reduce((n, i) => n + (i.title || '').length + 12, 0);
  const duration = `${Math.max(20, Math.round(chars / 7))}s`;

  return (
    <section className="breaking" aria-label="Breaking news">
      <div className="shell breaking-row">
        <span className="breaking-label"><span className="pulse" aria-hidden="true" />Breaking</span>
        <div className="breaking-track">
          <ul className="breaking-reel" style={{ '--reel-duration': duration }}>
            {row(0)}
            {row(1)}
          </ul>
        </div>
      </div>
    </section>
  );
}
