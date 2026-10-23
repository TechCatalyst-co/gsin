import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../auth/AuthContext';
import { APP_STORES, BRAND, categoryMeta } from '../brand';
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

function AppleLogo() {
  return (
    <svg width="22" height="26" viewBox="0 0 384 512" aria-hidden="true">
      <path fill="currentColor" d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z" />
    </svg>
  );
}

function PlayLogo() {
  return (
    <svg width="22" height="24" viewBox="0 0 512 512" aria-hidden="true">
      <path fill="currentColor" d="M325.3 234.3 104.6 13l280.8 161.2-60.1 60.1zM47 0C34 6.8 25.3 19.2 25.3 35.3v441.3c0 16.1 8.7 28.5 21.7 35.3l256.6-256L47 0zm425.2 225.6-58.9-34.1-65.7 64.5 65.7 64.5 60.1-34.1c18-14.3 18-46.5-1.2-60.8zM104.6 499l280.8-161.2-60.1-60.1L104.6 499z" />
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

  return (
    <div className="ld">
      <section className="ld-hero" aria-labelledby="ld-title">
        <div className="ld-hero-grid shell">
          <div className="ld-pitch">
            {/* The lockup's lettering is white, which works because the hero is always ink. */}
            <h1 id="ld-title" className="ld-lockup">
              <img src="/gsi-lockup-transparent.png" alt={BRAND.name} width="1309" height="782" />
            </h1>
            <p className="ld-promise"><abbr title={BRAND.name}>{BRAND.short}</abbr> is the world’s wire for artificial intelligence and the road to superintelligence. Summarized, curated, free all day.</p>
            <div className="ld-actions">
              <Link to="/news" className="ld-btn ld-btn--primary">Enter the newsroom <Arrow /></Link>
              <a href="#app" className="ld-btn ld-btn--quiet">Get the app</a>
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
                <Link to="/news">Open the newsroom</Link>
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
            {wire?.length > 0 && <Link to="/news" className="ld-wire-more">Every story in the newsroom <Arrow /></Link>}
          </section>
        </div>
      </section>

      <section className="ld-app" id="app" aria-labelledby="ld-app-h">
        <div className="shell ld-app-grid">
          <div>
            <h2 id="ld-app-h">Take the wire with you.</h2>
            <p>The {BRAND.name} app puts every desk, the daily intelligence brief and breaking alerts in your pocket. Free, like everything here.</p>
            <div className="ld-stores">
              <a href={APP_STORES.ios} className="ld-store" target="_blank" rel="noopener noreferrer">
                <AppleLogo />
                <span><small>Download on the</small>App Store</span>
              </a>
              {APP_STORES.android ? (
                <a href={APP_STORES.android} className="ld-store" target="_blank" rel="noopener noreferrer">
                  <PlayLogo />
                  <span><small>Get it on</small>Google Play</span>
                </a>
              ) : (
                <span className="ld-store is-soon" aria-label="Google Play, coming soon">
                  <PlayLogo />
                  <span><small>Coming soon to</small>Google Play</span>
                </span>
              )}
            </div>
          </div>
          <img className="ld-app-icon" src="/gsi-icon-1024-navy.png" alt="" width="200" height="200" loading="lazy" />
        </div>
      </section>
    </div>
  );
}
