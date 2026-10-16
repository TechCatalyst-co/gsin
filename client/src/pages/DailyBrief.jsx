import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../auth/AuthContext';
import { BRAND } from '../brand';
import CategoryTag from '../components/CategoryTag';
import SignalMeter from '../components/SignalMeter';
import { useDocumentTitle } from './Home';

const dayLabel = (ymd) => new Date(`${ymd}T12:00:00Z`).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });

export default function DailyBrief() {
  const { user, loading } = useAuth();
  const [params, setParams] = useSearchParams();
  const date = params.get('date');
  const [brief, setBrief] = useState(undefined);
  const [dates, setDates] = useState([]);
  const [error, setError] = useState('');
  const allowed = !!user?.capabilities?.accessDailyBrief;
  useDocumentTitle(`Daily Brief — ${BRAND.name}`);

  useEffect(() => {
    if (!allowed) return;
    setBrief(undefined);
    api(date ? `/daily-brief/${date}` : '/daily-brief/latest')
      .then((d) => setBrief(d.brief))
      .catch((e) => { setError(e.message); setBrief(null); });
  }, [allowed, date]);

  useEffect(() => {
    if (allowed) api('/daily-brief/dates').then((d) => setDates(d.dates || [])).catch(() => {});
  }, [allowed]);

  if (loading) return <div className="center muted">Loading…</div>;
  if (!allowed) return <BriefPitch signedIn={!!user} />;

  return (
    <div className="shell brief">
      <header className="brief-head">
        <h1>Daily Brief</h1>
        {dates.length > 1 && (
          <label className="brief-picker">
            Edition
            <select value={date || ''} onChange={(e) => setParams(e.target.value ? { date: e.target.value } : {})}>
              <option value="">Latest</option>
              {dates.map((d) => <option key={d} value={d}>{dayLabel(d)}</option>)}
            </select>
          </label>
        )}
      </header>
      {error && <div className="alert">{error}</div>}
      {brief === undefined && <div className="center muted">Loading the brief…</div>}
      {brief === null && !error && <div className="empty"><h2>No brief yet</h2><p>The first edition appears after the morning n8n run.</p></div>}
      {brief && (
        <>
          <div className="brief-edition">
            <p className="brief-date">{brief.briefingDateLabel}</p>
            {brief.windowStart && <p className="muted small">Covering {brief.windowStart} to {brief.windowEnd}</p>}
          </div>
          {brief.summary && <p className="brief-summary">{brief.summary}</p>}
          {brief.keyPoints?.length > 0 && (
            <section className="brief-points">
              <h2 className="section-h">Key points</h2>
              <ul>{brief.keyPoints.map((k, i) => <li key={i}>{k}</li>)}</ul>
            </section>
          )}
          {brief.statsLine && <p className="muted small">{brief.statsLine}</p>}
          <section>
            <h2 className="section-h">The stories</h2>
            <ol className="brief-items">
              {brief.items.map((i) => (
                <li key={i.url} className="brief-item">
                  <div className="brief-item-top">
                    <SignalMeter value={i.relevance} />
                    <CategoryTag name={i.category} />
                    {i.urgent && <span className="flag-breaking">Breaking</span>}
                  </div>
                  <h3>
                    {i.slug ? <Link to={`/story/${i.slug}`}>{i.title}</Link> : <a href={i.url} target="_blank" rel="noopener noreferrer">{i.title}</a>}
                  </h3>
                  {i.headline && <p className="brief-item-dek">{i.headline}</p>}
                  {i.impact && <p className="brief-item-why"><strong>Why it matters.</strong> {i.impact}</p>}
                  {i.slug && i.commentCount > 0 && <Link className="small" to={`/story/${i.slug}#disc`}>{i.commentCount} comments</Link>}
                </li>
              ))}
            </ol>
          </section>
        </>
      )}
    </div>
  );
}

function BriefPitch({ signedIn }) {
  return (
    <div className="shell narrow">
      <div className="pitch">
        <h1>The Daily Brief</h1>
        <p className="pitch-lede">One edition every morning. The handful of AI stories that actually moved the field, each with a plain-language note on why it matters.</p>
        <ul className="pitch-list">
          <li>Read in about five minutes, on the web, in the app, or by email</li>
          <li>Searchable archive of past editions</li>
          <li>Comes with extended analysis on stories and posting in discussions</li>
        </ul>
        <Link to="/premium" className="btn primary">Get Premium for {BRAND.premiumPrice}/mo</Link>
        {!signedIn && <p className="muted small">Already a member? <Link to="/login" state={{ from: '/brief' }}>Sign in</Link></p>}
      </div>
    </div>
  );
}
