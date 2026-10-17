import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../auth/AuthContext';
import { BRAND, CATEGORIES, categoryMeta } from '../brand';
import { storyPath } from '../format';
import { useDocumentTitle } from './Home';

const WIRE_SIZE = 7;
const POLL_MS = 60_000;

// Breaking, lead and latest arrive as separate lists; the wire is all of them,
// newest first, each story once.
function toWire(front) {
  if (!front) return [];
  const seen = new Set();
  return [...(front.breaking || []), front.lead, ...(front.latest || [])]
    .filter((i) => i && !seen.has(i._id) && seen.add(i._id))
    .sort((a, b) => new Date(b.published) - new Date(a.published))
    .slice(0, WIRE_SIZE);
}

function wireTime(d) {
  const t = new Date(d);
  if (Number.isNaN(t.getTime())) return '';
  const today = new Date().toDateString() === t.toDateString();
  return today
    ? t.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
    : t.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function Arrow() {
  return (
    <svg className="ld-arrow" width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path d="M3 9h11M10 4.5 14.5 9 10 13.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function Landing() {
  const { user } = useAuth();
  const [wire, setWire] = useState(null);
  const [fresh, setFresh] = useState(() => new Set());
  const [wireError, setWireError] = useState(false);
  const [checkedAt, setCheckedAt] = useState(null);
  const [entering, setEntering] = useState(true);
  const [counts, setCounts] = useState({});
  const [brief, setBrief] = useState(undefined);
  const known = useRef(null);
  useDocumentTitle(`${BRAND.short} — ${BRAND.name}`);

  useEffect(() => {
    let alive = true;
    const pull = () => api('/news/front-page')
      .then((front) => {
        if (!alive) return;
        const next = toWire(front);
        // Only stories that arrive after the first load are marked fresh.
        if (known.current) setFresh(new Set(next.filter((i) => !known.current.has(i._id)).map((i) => i._id)));
        known.current = new Set(next.map((i) => i._id));
        setWire(next);
        setWireError(false);
        setCheckedAt(new Date());
      })
      .catch(() => { if (alive) { setWireError(true); setWire((w) => w || []); } });
    pull();
    const id = setInterval(pull, POLL_MS);
    return () => { alive = false; clearInterval(id); };
  }, [user?.id]);

  // The filing entrance plays once, on the first load only; later polls must
  // not restart it when a row's classes change.
  useEffect(() => {
    if (!wire) return undefined;
    const id = setTimeout(() => setEntering(false), 2500);
    return () => clearTimeout(id);
  }, [wire === null]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    api('/news/categories')
      .then((d) => setCounts(Object.fromEntries((d.categories || []).map((c) => [c.category, c.count]))))
      .catch(() => {});
    api('/daily-brief/latest').then((d) => setBrief(d.brief || null)).catch(() => setBrief(null));
  }, []);

  return (
    <div className="ld">
      <section className="ld-hero" aria-labelledby="ld-title">
        <header className="ld-bar shell">
          <Link to="/" className="ld-bar-brand" aria-label={`${BRAND.name} home`}>{BRAND.short}</Link>
          <nav className="ld-bar-nav" aria-label="Primary">
            <Link to="/newsroom">Newsroom</Link>
            <Link to="/brief">Daily Brief</Link>
            {user ? <Link to="/account">Account</Link> : <Link to="/login">Sign in</Link>}
          </nav>
        </header>

        <div className="ld-hero-grid shell">
          <div className="ld-pitch">
            <h1 id="ld-title" className="ld-lockup">
              <svg className="ld-curve" viewBox="0 0 32 32" aria-hidden="true">
                <path d="M4 28 H28" className="ld-curve-axis" />
                <path d="M4 27 C14 27 20 25 24 16 C26 11 27 7 27.5 3" className="ld-curve-line" pathLength="1" />
                <circle cx="27.5" cy="3.5" r="2.4" className="ld-curve-dot" />
              </svg>
              <span className="ld-mark" aria-hidden="true">{BRAND.short}</span>
              <span className="sr-only">{BRAND.name}</span>
            </h1>
            <p className="ld-promise">The world’s wire for artificial intelligence and the road to superintelligence. Summarized, curated, free all day.</p>
            <div className="ld-actions">
              <Link to="/newsroom" className="ld-btn ld-btn--primary">Enter the newsroom <Arrow /></Link>
              <Link to="/brief" className="ld-btn ld-btn--quiet">Read today’s brief</Link>
            </div>
          </div>

          <section className="ld-wire" aria-labelledby="ld-wire-h">
            <div className="ld-wire-head">
              <h2 id="ld-wire-h"><span className="ld-live" aria-hidden="true" />Live on the wire</h2>
              {checkedAt && !wireError && (
                <span className="ld-wire-checked">Checked {checkedAt.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}</span>
              )}
            </div>
            <p className="sr-only" aria-live="polite">
              {fresh.size > 0 ? `${fresh.size} new ${fresh.size === 1 ? 'story' : 'stories'} on the wire` : ''}
            </p>
            {wire === null ? (
              <ol className="ld-wire-list" aria-busy="true">
                {Array.from({ length: 5 }, (_, n) => <li key={n} className="ld-wire-row ld-wire-row--ghost"><span /><span /></li>)}
              </ol>
            ) : wire.length === 0 ? (
              <div className="ld-wire-empty">
                <p className="ld-wire-empty-h">{wireError ? 'The wire didn’t answer.' : 'The wire is quiet.'}</p>
                <p>{wireError ? 'We couldn’t load the latest stories just now. The newsroom may still have them.' : 'New stories appear here within a minute of arriving.'}</p>
                <Link to="/newsroom">Open the newsroom</Link>
              </div>
            ) : (
              <ol className={`ld-wire-list${entering ? ' is-entering' : ''}`}>
                {wire.map((i, n) => {
                  const meta = categoryMeta(i.category);
                  return (
                    <li key={i._id} className={`ld-wire-row${fresh.has(i._id) ? ' is-fresh' : ''}`} style={{ '--n': n }}>
                      <div className="ld-wire-meta">
                        <time dateTime={i.published}>{wireTime(i.published)}</time>
                        <span className="ld-desk"><span className="cat-dot" style={{ background: meta.hue }} aria-hidden="true" />{meta.name}</span>
                        {i.urgent && <span className="ld-flag">Breaking</span>}
                      </div>
                      <Link to={storyPath(i)} className="ld-wire-title">{i.title}</Link>
                    </li>
                  );
                })}
              </ol>
            )}
            {wire?.length > 0 && <Link to="/newsroom" className="ld-wire-more">Every story in the newsroom <Arrow /></Link>}
          </section>
        </div>
      </section>

      <section className="ld-desks" aria-labelledby="ld-desks-h">
        <div className="shell ld-desks-grid">
          <div className="ld-desks-intro">
            <h2 id="ld-desks-h">Nine desks.<br />One wire.</h2>
            <p>From frontier model launches to chip fabs and alignment research, every story is filed to the desk that covers it. Follow the ones you care about.</p>
          </div>
          <ul className="ld-desk-index">
            {CATEGORIES.map((c) => {
              const count = counts[c.name];
              return (
                <li key={c.slug}>
                  <Link to={`/topic/${c.slug}`} className="ld-desk-link">
                    <span className="ld-desk-name"><span className="cat-dot" style={{ background: c.hue }} aria-hidden="true" />{c.name}</span>
                    {count > 0 && <span className="ld-desk-count">{count.toLocaleString()} {count === 1 ? 'story' : 'stories'}</span>}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      <section className="ld-brief" aria-labelledby="ld-brief-h">
        <div className="shell ld-brief-grid">
          <div>
            <h2 id="ld-brief-h">The Daily Brief</h2>
            {brief?.briefingDateLabel && <p className="ld-brief-date">{brief.briefingDateLabel}</p>}
            {brief?.summary
              ? <p className="ld-brief-summary">{brief.summary}</p>
              : <p className="ld-brief-summary">Every morning: the stories that moved AI forward, why they matter, and what to watch next.</p>}
            {brief?.items?.length > 0 && (
              <ol className="ld-brief-items">
                {brief.items.slice(0, 3).map((i) => (
                  <li key={i.url}>
                    {i.slug ? <Link to={`/story/${i.slug}`}>{i.title}</Link> : <a href={i.url} target="_blank" rel="noopener noreferrer">{i.title}</a>}
                  </li>
                ))}
              </ol>
            )}
          </div>
          <aside className="ld-brief-act">
            <Link to="/brief" className="ld-btn ld-btn--primary">{brief ? 'Read today’s brief' : 'Open the Daily Brief'} <Arrow /></Link>
            {user ? (
              <p>Your brief arrives by email each morning. Change that any time in <Link to="/account">your account</Link>.</p>
            ) : (
              <p><Link to="/register">Create a free account</Link> and the brief lands in your inbox every morning. You can turn the email off any time.</p>
            )}
          </aside>
        </div>
      </section>

      <section className="ld-close" aria-labelledby="ld-close-h">
        <div className="shell ld-close-grid">
          <h2 id="ld-close-h">Every story, every desk, free.</h2>
          <div>
            <p>Our automated newsroom reads lab blogs, arXiv and the policy wires, summarizes each story with why it matters, and editors curate what makes the front page. No paywall, no premium tier. Always check the original source; we link it on every story.</p>
            <Link to="/newsroom" className="ld-btn ld-btn--ink">Enter the newsroom <Arrow /></Link>
          </div>
        </div>
      </section>
    </div>
  );
}
