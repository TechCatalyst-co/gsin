import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { api } from '../api';
import { timeAgo } from '../format';

const POLL_MS = 5 * 60 * 1000;
const SEEN_KEY = 'gsi-alerts-seen';

function readSeen() {
  try { return Number(localStorage.getItem(SEEN_KEY)) || 0; } catch { return 0; }
}
function writeSeen(t) {
  try { localStorage.setItem(SEEN_KEY, String(t)); } catch { /* private mode */ }
}

export const alertPath = (a) => (a.type === 'brief'
  ? `/intelligence/${a.date}/${a.briefType || 'morning'}`
  : `/story/${encodeURIComponent(a.slug)}`);

// The bell in the masthead: the push alerts that went out (breaking stories
// and "the brief is out"), so one missed on the phone can still be found here.
// "Seen" is one timestamp per browser; there's no account involved.
export default function AlertsBell() {
  const [alerts, setAlerts] = useState([]);
  const [seen, setSeen] = useState(readSeen);
  const [open, setOpen] = useState(false);
  const [failed, setFailed] = useState(false);
  const wrap = useRef(null);
  const { pathname } = useLocation();

  const pull = useCallback(() => {
    if (document.visibilityState === 'hidden') return;
    api('/news/alerts?limit=30')
      .then((d) => { setAlerts(d.alerts || []); setFailed(false); })
      .catch(() => setFailed(true));
  }, []);

  useEffect(() => {
    pull();
    const timer = setInterval(pull, POLL_MS);
    document.addEventListener('visibilitychange', pull);
    return () => { clearInterval(timer); document.removeEventListener('visibilitychange', pull); };
  }, [pull]);

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => { if (wrap.current && !wrap.current.contains(e.target)) setOpen(false); };
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey); };
  }, [open]);

  const newest = alerts.length ? new Date(alerts[0].at).getTime() : 0;
  const unread = newest > seen;

  const toggle = () => {
    const next = !open;
    setOpen(next);
    if (next) {
      pull();
      if (newest) { setSeen(newest); writeSeen(newest); }
    }
  };

  return (
    <div className="alerts" ref={wrap}>
      <button
        className="theme-toggle alerts-bell"
        type="button"
        onClick={toggle}
        aria-expanded={open}
        aria-controls="alerts-panel"
        aria-label={unread ? 'Alerts, new' : 'Alerts'}
        title="Alerts"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" aria-hidden="true">
          <path d="M4 6.5a4 4 0 0 1 8 0c0 3 1.2 4.3 1.5 4.8H2.5C2.8 10.8 4 9.5 4 6.5z" />
          <path d="M6.5 13.3a1.6 1.6 0 0 0 3 0" />
        </svg>
        {unread && <span className="alerts-dot" aria-hidden="true" />}
      </button>
      {open && (
        <div className="alerts-pop" id="alerts-panel" role="region" aria-label="Alerts">
          <div className="alerts-head">
            <span>Alerts</span>
            <span className="alerts-sub">Sent to the app</span>
          </div>
          {alerts.length ? (
            <ul className="alerts-list">
              {alerts.map((a) => (
                <li key={`${a.type}-${a.slug || `${a.date}-${a.briefType}`}`}>
                  <Link to={alertPath(a)} className="alerts-row">
                    <span className={`alerts-tag alerts-tag--${a.type}`}>{a.type === 'brief' ? 'Brief' : 'Breaking'}</span>
                    <span className="alerts-title">{a.title}</span>
                    <span className="alerts-time">{timeAgo(a.at)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="alerts-empty">{failed ? 'Couldn’t load alerts. Try again shortly.' : 'No alerts yet. Breaking stories and new briefs show up here.'}</p>
          )}
        </div>
      )}
    </div>
  );
}
