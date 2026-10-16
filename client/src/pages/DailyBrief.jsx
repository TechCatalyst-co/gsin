import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../api';
import { BRAND } from '../brand';
import CategoryTag from '../components/CategoryTag';
import AdSlot from '../components/AdSlot';
import { Fragment } from 'react';
import { useDocumentTitle } from './Home';

const dayLabel = (ymd) => new Date(`${ymd}T12:00:00Z`).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });

export default function DailyBrief() {
  const [params, setParams] = useSearchParams();
  const date = params.get('date');
  const [brief, setBrief] = useState(undefined);
  const [dates, setDates] = useState([]);
  const [error, setError] = useState('');
  useDocumentTitle(`Daily Brief — ${BRAND.short}`);

  useEffect(() => {
    setBrief(undefined);
    api(date ? `/daily-brief/${date}` : '/daily-brief/latest')
      .then((d) => setBrief(d.brief))
      .catch((e) => { setError(e.message); setBrief(null); });
  }, [date]);

  useEffect(() => {
    api('/daily-brief/dates').then((d) => setDates(d.dates || [])).catch(() => {});
  }, []);

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
              {brief.items.map((i, n) => (
                <Fragment key={i.url}>
                <li className="brief-item">
                  <div className="brief-item-top">
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
                {n === 2 && brief.items.length > 4 && <li className="brief-ad"><AdSlot placement="brief-inline" /></li>}
                </Fragment>
              ))}
            </ol>
          </section>
        </>
      )}
    </div>
  );
}

