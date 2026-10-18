import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../auth/AuthContext';
import { BRAND, CATEGORIES, categoryMeta } from '../brand';
import AdSlot from '../components/AdSlot';
import Ticker from '../components/Ticker';
import { LabelChip } from '../components/Chips';
import { ConfidenceRing } from '../components/Signal';
import { StoryLead, StoryList, StoryRow } from '../components/Story';
import { storyPath, timeAgo } from '../format';

function useDocumentTitle(title) {
  useEffect(() => {
    document.title = title;
  }, [title]);
}

export { useDocumentTitle };

// The lead is the strongest verified item: T1 with a primary source first, then the newest breaking,
// then the editors' pick, then the latest.
function pickLead({ breaking = [], featured = [], latest = [] }) {
  const t1 = [...breaking, ...latest].filter((i) => i.urgencyTier === 1).sort((a, b) => (b.primarySource - a.primarySource) || (b.signalScore || 0) - (a.signalScore || 0));
  return t1[0] || breaking[0] || featured[0] || latest[0] || null;
}

export default function Home() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [feed, setFeed] = useState([]);
  const [briefs, setBriefs] = useState([]);
  const [error, setError] = useState('');
  useDocumentTitle(`${BRAND.name} — ${BRAND.tagline}`);

  useEffect(() => {
    api('/news/front-page').then(setData).catch((e) => setError(e.message));
    api('/news?tier=3&sort=signal&hours=168&limit=40').then((d) => setFeed(d.items || [])).catch(() => {});
    api('/daily-brief/list?limit=4').then((d) => setBriefs(d.briefs || [])).catch(() => {});
  }, [user?.id]);

  if (error) return <div className="shell"><div className="alert">{error}</div></div>;
  if (!data) return <div className="center muted">Sweeping the radar…</div>;

  const lead = pickLead(data);
  const pool = feed.length ? feed : data.latest;
  const rest = pool.filter((i) => i._id !== lead?._id);
  const isEmpty = !lead;

  return (
    <>
      <Ticker items={[...(lead ? [lead] : []), ...rest].slice(0, 8)} />
      <div className="shell">
        {isEmpty ? (
          <div className="empty">
            <h1>The radar is live and nothing has cleared the bar yet.</h1>
            <p>Stories appear here the moment one grades Tier 1 to 3. The radar sweeps {BRAND.sourceCount} sources every 30 minutes.</p>
          </div>
        ) : (
          <>
            <StoryLead item={lead} />
            <Lanes items={pool} />
            <div className="front">
              <section className="front-main" aria-labelledby="latest-h">
                {data.featured.length > 0 && (
                  <div className="picks">
                    <h2 className="section-h">Editors’ picks</h2>
                    <div className="picks-grid">
                      {data.featured.slice(0, 3).map((i) => <StoryRow key={i._id} item={i} compact />)}
                    </div>
                  </div>
                )}
                <h2 id="latest-h" className="section-h">All signal <small>Tier 1 to 3 from the last seven days, strongest first</small></h2>
                <StoryList items={rest} adEvery={6} adPlacement="home-feed" />
                <Link to="/search" className="more-link">Browse all stories</Link>
              </section>

              <aside className="front-side">
                {briefs.slice(0, 2).map((b) => <BriefCard key={b._id} brief={b} />)}
                {briefs.length === 0 && <BriefPromo />}
                <AdSlot placement="home-sidebar" />
                {data.mostDiscussed.length > 0 && (
                  <section className="side-block" aria-labelledby="disc-h">
                    <h2 id="disc-h" className="section-h">Most discussed this week</h2>
                    <ol className="ranked">
                      {data.mostDiscussed.map((i) => (
                        <li key={i._id}>
                          <Link to={storyPath(i)}>{i.title}</Link>
                          <span className="muted">{i.commentCount} comments</span>
                        </li>
                      ))}
                    </ol>
                  </section>
                )}
                <section className="side-block brief-promo" aria-labelledby="grade-h">
                  <h2 id="grade-h">How stories are graded</h2>
                  <p>Every item is scored against a strict rubric and the code enforces it: a primary source and under 24 hours for Tier 1, nothing older than seven days, echoes demoted. <Link to="/about">The full rubric</Link>.</p>
                </section>
              </aside>
            </div>
          </>
        )}
      </div>
    </>
  );
}

// Domain lanes: how much signal each desk carried this week, and its latest headline.
function Lanes({ items }) {
  const groups = new Map();
  for (const it of items) {
    const key = it.category || 'Other';
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(it);
  }
  const lanes = [...groups.entries()].sort((a, b) => b[1].length - a[1].length).slice(0, 10);
  if (!lanes.length) return null;
  const max = lanes[0][1].length;
  return (
    <section className="lanes" aria-label="Lanes by desk">
      <h2 className="section-h">Lanes <small>last seven days, by desk</small></h2>
      <div className="lanes-row">
        {lanes.map(([name, xs]) => {
          const meta = categoryMeta(name);
          const known = CATEGORIES.some((c) => c.name === meta.name);
          return (
            <Link key={name} to={known ? `/topic/${meta.slug}` : `/topic/${meta.slug}?name=${encodeURIComponent(name)}`} className="lane">
              <div className="lane-top"><span className="lane-name">{meta.short}</span><span className="lane-count">{xs.length}</span></div>
              <div className="lane-latest">{xs[0].title}</div>
              <div className="lane-bar"><i style={{ width: `${Math.round((xs.length / max) * 100)}%` }} /></div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

function BriefCard({ brief }) {
  const evening = brief.briefType === 'evening';
  return (
    <section className="brief-promo" aria-label={evening ? 'Evening Daily Brief' : 'Morning Briefing'}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
        <div>
          <h2>{evening ? 'Evening Daily Brief' : 'Morning Briefing'}</h2>
          <div className="muted small">{brief.briefingDateLabel}{brief.generatedAt ? ` · generated ${timeAgo(brief.generatedAt)}` : ''}</div>
        </div>
        {evening && brief.confidence != null && <ConfidenceRing value={brief.confidence} size={54} />}
      </div>
      <p style={{ marginTop: 10 }}>{brief.plainSummary || brief.summary}</p>
      {brief.keyPoints?.length > 0 && <ul className="bullets small">{brief.keyPoints.slice(0, 3).map((k, i) => <li key={i}>{k}</li>)}</ul>}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
        <LabelChip kind="analysis" />
        <Link to={`/intelligence/${brief.dateSlug}/${brief.briefType}`} className="link">Read the brief</Link>
      </div>
    </section>
  );
}

function BriefPromo() {
  return (
    <section className="brief-promo">
      <h2>Two briefs a day</h2>
      <p>The Morning Briefing at 6:50 AM Pacific consolidates the last 24 hours. The Evening Daily Brief at 5:25 PM is written by an analyst agent, grades its own forecasts, and is audited before it goes out.</p>
      <Link to="/intelligence" className="btn primary sm">Open Intelligence</Link>
    </section>
  );
}
