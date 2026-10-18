import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { BRAND } from '../brand';
import { LabelChip } from '../components/Chips';
import { storyPath, timeAgo } from '../format';
import { useDocumentTitle } from './Home';

const PT = 'America/Los_Angeles';
function nextAt(hour, minute) {
  const now = new Date();
  const parts = new Intl.DateTimeFormat('en-US', { timeZone: PT, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false }).formatToParts(now);
  const get = (t) => Number(parts.find((p) => p.type === t).value);
  const nowMin = get('hour') * 60 + get('minute');
  const target = hour * 60 + minute;
  const diff = (target - nowMin + (target > nowMin ? 0 : 24 * 60)) * 60000;
  return new Date(now.getTime() + diff);
}
function countdown(d) {
  const s = Math.max(0, Math.round((d - Date.now()) / 1000));
  const days = Math.floor(s / 86400), h = Math.floor((s % 86400) / 3600), m = Math.floor((s % 3600) / 60);
  if (days > 0) return h > 0 ? `in ${days}d ${h}h` : `in ${days}d`;
  if (h > 0) return `in ${h}h ${m}m`;
  return `in ${Math.max(1, m)}m`;
}

// Dated facts on a timeline (the two scheduled briefs, then radar-captured upcoming items), and the
// analyst's forecast kept apart and labelled speculative.
export default function Watchlist() {
  const [upcoming, setUpcoming] = useState([]);
  const [evening, setEvening] = useState(null);
  const [, tick] = useState(0);
  useDocumentTitle(`Watchlist — ${BRAND.name}`);

  useEffect(() => {
    api('/news?horizon=upcoming&hours=336&limit=40').then((d) => setUpcoming(d.items || [])).catch(() => {});
    api('/daily-brief/latest?type=evening').then((d) => setEvening(d.brief)).catch(() => {});
    const id = setInterval(() => tick((n) => n + 1), 30_000);
    return () => clearInterval(id);
  }, []);

  const morning = nextAt(6, 50), eve = nextAt(17, 25);
  const scheduled = [
    { when: morning, type: 'morning' },
    { when: eve, type: 'evening' },
  ].sort((a, b) => a.when - b.when);

  return (
    <div className="shell wl">
      <header className="intel-head">
        <div>
          <h1>Watchlist</h1>
          <p className="muted" style={{ margin: '4px 0 0' }}>Dated facts first. Forecasts kept apart.</p>
        </div>
      </header>
      <div className="wl-grid">
        <section aria-labelledby="dated-h">
          <h2 id="dated-h" className="section-h">Dated and scheduled <small>what is certain</small></h2>
          <ol className="timeline">
            {scheduled.map((s, i) => (
              <li key={s.type} className="tl">
                <div className="node"><div className={`dot${i === 0 ? ' now' : ''}`} /><div className="line" /></div>
                <div className="body">
                  <div className="when"><span className={`chip${i === 0 ? ' t1' : ''}`}>{s.type === 'evening' ? 'Evening brief' : 'Morning briefing'}</span><span>{s.when.toLocaleTimeString('en-US', { timeZone: PT, hour: 'numeric', minute: '2-digit' })} PT</span><span className="count">{countdown(s.when)}</span></div>
                  <div className="t"><Link to="/intelligence">{s.type === 'evening' ? 'Evening Daily Brief goes out, with yesterday’s forecasts graded' : 'Morning Briefing consolidates the last 24 hours'}</Link></div>
                  <div className="src">{BRAND.name} · scheduled</div>
                </div>
              </li>
            ))}
            {upcoming.map((it, i) => (
              <li key={it._id} className="tl">
                <div className="node"><div className="dot" />{i < upcoming.length - 1 && <div className="line" />}</div>
                <div className="body">
                  <div className="when"><span className="chip">Captured {timeAgo(it.capturedAt || it.published)}</span>{it.urgencyTier && <span>T{it.urgencyTier}</span>}<span className="count">dated event</span></div>
                  <div className="t"><Link to={storyPath(it)}>{it.title}</Link></div>
                  <div className="src">{it.source} · {it.primarySource ? 'Verified primary source' : 'Reported'}</div>
                </div>
              </li>
            ))}
          </ol>
          {upcoming.length === 0 && <p className="muted small">Items the radar tags as upcoming, with a date or a deadline, appear here.</p>}
        </section>
        <aside aria-labelledby="fc-h">
          <h2 id="fc-h" className="section-h">Next 24 to 72 hours <LabelChip kind="forecast" /></h2>
          {evening?.forwardWatchlist?.length ? (
            <>
              {evening.forwardWatchlist.map((w, i) => (
                <div key={i} className="forecast">
                  <div className="fc-top"><span className="chip">Next {w.window || '72h'}</span><span className="muted small">from the evening brief</span></div>
                  <h3>{w.item}</h3>
                  {w.why && <p>{w.why}</p>}
                </div>
              ))}
              <p className="muted small">From the evening brief of {evening.briefingDateLabel}. The analyst grades these against the next day’s events.</p>
            </>
          ) : <p className="muted small">The forecast appears after the first evening brief at 5:25 PM Pacific.</p>}
        </aside>
      </div>
    </div>
  );
}
