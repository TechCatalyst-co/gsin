import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../api';
import { BRAND, domainShort } from '../brand';
import { LabelChip } from '../components/Chips';
import { ConfidenceRing } from '../components/Signal';
import BriefCalendar from '../components/BriefCalendar';
import { Fold, TopicGroups } from '../components/Fold';
import { useDocumentTitle } from './Home';

const isEvening = (b) => b?.briefType === 'evening';
const statusLabel = (s) => String(s || 'pending').replace(/_/g, ' ');

// Intelligence: two briefs a day. The morning briefing consolidates the last 24 hours; the evening
// brief is written by an analyst agent, grades its own forecasts, and is audited before it goes out.
export default function Intelligence() {
  const { date, type } = useParams();
  const nav = useNavigate();
  const [brief, setBrief] = useState(undefined);
  const [editions, setEditions] = useState([]);
  const [error, setError] = useState('');
  useDocumentTitle(`Briefs — ${BRAND.name}`);

  useEffect(() => {
    setBrief(undefined);
    setError('');
    const path = date ? `/daily-brief/${date}${type ? `/${type}` : ''}` : `/daily-brief/latest${type ? `?type=${type}` : ''}`;
    api(path).then((d) => setBrief(d.brief)).catch((e) => { setError(e.status === 404 ? 'No brief for that edition yet.' : e.message); setBrief(null); });
    window.scrollTo(0, 0);
  }, [date, type]);

  useEffect(() => {
    api('/daily-brief/dates').then((d) => setEditions(d.editions || [])).catch(() => {});
  }, []);

  const dates = [...new Set(editions.map((e) => e.date))];
  const currentDate = brief?.briefingDate ? brief.briefingDate.slice(0, 10) : date || dates[0];
  const todayHas = (t) => editions.some((e) => e.date === currentDate && e.type === t);

  return (
    <div className="shell intel">
      <header className="intel-head">
        <div>
          <h1>Briefs</h1>
          <p className="muted" style={{ margin: '4px 0 0' }}>Two briefs a day, audited before they go out. <LabelChip kind="analysis" /></p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          {currentDate && (
            <div className="editions" role="group" aria-label="Edition">
              <button className={isEvening(brief) ? '' : 'is-on'} disabled={!todayHas('morning') && brief && isEvening(brief)} onClick={() => nav(`/intelligence/${currentDate}/morning`)}>Morning</button>
              <button className={isEvening(brief) ? 'is-on' : ''} disabled={!todayHas('evening') && brief && !isEvening(brief)} onClick={() => nav(`/intelligence/${currentDate}/evening`)}>Evening</button>
            </div>
          )}
          {dates.length > 0 && (
            <BriefCalendar value={currentDate} available={dates} onChange={(d) => nav(`/intelligence/${d}`)} />
          )}
        </div>
      </header>

      {error && <div className="alert">{error}</div>}
      {brief === undefined && <div className="center muted">Loading the brief…</div>}
      {brief === null && !error && <div className="empty"><h2>No brief yet</h2><p>The first Morning Briefing goes out at 6:50 AM Pacific; the Evening Daily Brief at 5:25 PM.</p></div>}
      {brief && <BriefBody brief={brief} />}
    </div>
  );
}

function BriefBody({ brief }) {
  const evening = isEvening(brief);
  return (
    <>
      <section className="dossier" aria-label={evening ? 'Evening Daily Brief' : 'Morning Briefing'}>
        <div className="dossier-top">
          <div>
            <div className="dossier-kicker">✦&nbsp;&nbsp;{evening ? 'EVENING DAILY BRIEF' : 'MORNING BRIEFING'}</div>
            <div className="dossier-date">{brief.briefingDateLabel || brief.briefingDate?.slice(0, 10)}</div>
            <div className="dossier-meta">{evening ? '5:25 PM PT' : '6:50 AM PT'}{brief.windowStart ? `  ·  covers ${brief.windowStart} to ${brief.windowEnd}` : ''}{brief.items?.length ? `  ·  ${brief.items.length} stories` : ''}</div>
          </div>
          {evening && brief.confidence != null && <ConfidenceRing value={brief.confidence} />}
        </div>
        <div className="dossier-body">
          {brief.summary && <p style={{ color: 'var(--ink)', fontSize: 17, lineHeight: 1.55 }}>{brief.summary}</p>}
          {brief.plainSummary && <p><strong>In plain English.</strong> {brief.plainSummary}</p>}
          {brief.keyPoints?.length > 0 && <ul className="bullets">{brief.keyPoints.map((k, i) => <li key={i}>{k}</li>)}</ul>}
          {brief.watchToday && <p><strong>Watching today.</strong> {brief.watchToday}</p>}
          {brief.horizonNote && <p><strong>On the horizon.</strong> {brief.horizonNote}</p>}
          {brief.statsLine && <p className="muted small">{brief.statsLine}</p>}
        </div>
      </section>

      {brief.watchlistFollowup?.length > 0 && (
        <Fold title={'Yesterday’s calls, graded'} count={brief.watchlistFollowup.length}>
          <LabelChip kind="analysis" />
          <div className="cards2">
            {brief.watchlistFollowup.map((f, i) => (
              <div key={i} className="card">
                <span className={`chip${f.status === 'confirmed' ? ' t1' : ''}`} style={{ alignSelf: 'flex-start' }}>{statusLabel(f.status)}</span>
                <div>{f.predicted}</div>
                {f.evidence && <div className="evidence">Evidence: {f.evidence}</div>}
              </div>
            ))}
          </div>
        </Fold>
      )}

      {brief.criticalIntelligence?.length > 0 && (
        <Fold title={'Critical intelligence'} count={brief.criticalIntelligence.length}>
          <LabelChip kind="analysis" />
          {brief.criticalIntelligence.map((c, i) => (
            <div key={i} className={`card${c.priority === 'HIGH' ? ' hi' : ''}`} style={{ marginBottom: 10 }}>
              <div className="chips">
                <span className={`chip${c.priority === 'HIGH' ? ' t1' : ''}`}>{c.priority === 'HIGH' ? 'High priority' : 'Medium'}</span>
                {c.domain && <span className="chip">{domainShort(c.domain)}</span>}
              </div>
              <h3 style={{ fontSize: 16 }}>{c.headline}</h3>
              <div className="why-line">{c.whyItMatters}</div>
              {c.url && <a href={c.url} target="_blank" rel="noopener noreferrer" className="small">Read the original source ↗</a>}
            </div>
          ))}
        </Fold>
      )}

      {brief.emergingTrends?.length > 0 && (
        <Fold title={'Emerging trends'} count={brief.emergingTrends.length}>
          <LabelChip kind="analysis" />
          <div className="cards2">
            {brief.emergingTrends.map((t, i) => (
              <div key={i} className="card">
                {t.domain && <span className="chip" style={{ alignSelf: 'flex-start' }}>{t.domain}</span>}
                <strong>{t.trend}</strong>
                <div className="why-line">{t.evidence}</div>
              </div>
            ))}
          </div>
        </Fold>
      )}

      {brief.crossDomainInsights?.length > 0 && (
        <Fold title="Cross-domain insights" count={brief.crossDomainInsights.length}>
          <section className="insight">
            {brief.crossDomainInsights.map((s, i) => <p key={i}>{s}</p>)}
          </section>
        </Fold>
      )}

      {brief.forwardWatchlist?.length > 0 && (
        <Fold title={'Watchlist, next 24 to 72 hours'} count={brief.forwardWatchlist.length}>
          <LabelChip kind="forecast" />
          {brief.forwardWatchlist.map((w, i) => (
            <div key={i} className="forecast">
              <div className="fc-top"><span className="chip">Next {w.window || '72h'}</span></div>
              <h3>{w.item}</h3>
              {w.why && <p>{w.why}</p>}
            </div>
          ))}
          <p className="muted small">The analyst grades these against the next day’s events. <Link to="/watchlist">The full watchlist</Link>.</p>
        </Fold>
      )}

      {brief.items?.length > 0 && (
        <section className="intel-section" aria-labelledby="items-h">
          <h2 id="items-h">Stories in this brief <span className="fold-count">{brief.items.length}</span> <LabelChip kind="reporting" /></h2>
          <TopicGroups items={brief.items} render={(xs) => <BriefItems items={xs} />} />
        </section>
      )}
    </>
  );
}

// One topic's stories in a brief: headline, dek and why it matters.
function BriefItems({ items }) {
  return (
    <ol className="brief-items">
      {items.map((i) => (
        <li key={i.url} className="brief-item">
          {i.urgencyTier === 1 && <div className="brief-item-top"><span className="flag-breaking">Breaking</span></div>}
          <h3>
            {i.slug ? <Link to={`/story/${i.slug}`}>{i.title}</Link> : <a href={i.url} target="_blank" rel="noopener noreferrer">{i.title}</a>}
          </h3>
          {i.headline && i.headline !== i.title && <p className="brief-item-dek">{i.headline}</p>}
          {i.impact && <p className="brief-item-why"><strong>Why it matters.</strong> {i.impact}</p>}
          {i.slug && i.commentCount > 0 && <Link className="small" to={`/story/${i.slug}#disc`}>{i.commentCount} comments</Link>}
        </li>
      ))}
    </ol>
  );
}
