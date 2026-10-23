import { useEffect, useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../auth/AuthContext';
import { BRAND, CATEGORIES } from '../brand';
import { StoryLead, StoryList } from '../components/Story';
import { storyPath } from '../format';

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
  const [brief, setBrief] = useState(null);
  const [error, setError] = useState('');
  useDocumentTitle(`${BRAND.name} — ${BRAND.tagline}`);

  useEffect(() => {
    api('/news/front-page').then(setData).catch((e) => setError(e.message));
    api('/news?tier=3&sort=signal&hours=168&limit=40').then((d) => setFeed(d.items || [])).catch(() => {});
    api('/daily-brief/list?limit=1').then((d) => setBrief(d.briefs?.[0] || null)).catch(() => {});
  }, [user?.id]);

  if (error) return <div className="shell"><div className="alert">{error}</div></div>;
  if (!data) return <div className="center muted">Sweeping the radar…</div>;

  const lead = pickLead(data);
  const pool = feed.length ? feed : data.latest;
  const rest = pool.filter((i) => i._id !== lead?._id);

  return (
    <div className="shell">
      <TopicBar />
      {!lead ? (
        <div className="empty">
          <h1>The radar is live and nothing has cleared the bar yet.</h1>
          <p>Stories appear here the moment one grades Tier 1 to 3. The radar sweeps {BRAND.sourceCount} sources every 30 minutes.</p>
        </div>
      ) : (
        <>
          <StoryLead item={lead} />
          <div className="front">
            <section className="front-main" aria-labelledby="latest-h">
              <h2 id="latest-h" className="section-h">Latest <small>the last seven days, strongest first</small></h2>
              <StoryList items={rest} adEvery={6} adPlacement="home-feed" />
              <Link to="/search" className="more-link">Browse all stories</Link>
            </section>

            <aside className="front-side">
              {brief ? <BriefCard brief={brief} /> : <BriefPromo />}
              {data.mostDiscussed.length > 0 && (
                <section className="side-block" aria-labelledby="disc-h">
                  <h2 id="disc-h" className="section-h">Most discussed</h2>
                  <ol className="ranked">
                    {data.mostDiscussed.slice(0, 5).map((i) => (
                      <li key={i._id}>
                        <Link to={storyPath(i)}>{i.title}</Link>
                        <span className="muted">{i.commentCount} comments</span>
                      </li>
                    ))}
                  </ol>
                </section>
              )}
            </aside>
          </div>
        </>
      )}
    </div>
  );
}

// The one place the desks are listed: a quiet filter row at the top of News.
export function TopicBar() {
  return (
    <nav className="topic-bar" aria-label="Topics">
      <NavLink to="/news" className="topic-pill">All</NavLink>
      {CATEGORIES.map((c) => <NavLink key={c.slug} to={`/topic/${c.slug}`} className="topic-pill">{c.short}</NavLink>)}
      <NavLink to="/research" className="topic-pill">Research</NavLink>
    </nav>
  );
}

function BriefCard({ brief }) {
  const evening = brief.briefType === 'evening';
  return (
    <section className="brief-promo" aria-label={evening ? 'Evening Daily Brief' : 'Morning Briefing'}>
      <h2>{evening ? 'Evening Daily Brief' : 'Morning Briefing'}</h2>
      <div className="muted small">{brief.briefingDateLabel}</div>
      <p style={{ margin: '10px 0' }}>{brief.plainSummary || brief.summary}</p>
      <Link to={`/intelligence/${brief.dateSlug}/${brief.briefType}`} className="link">Read the brief</Link>
    </section>
  );
}

function BriefPromo() {
  return (
    <section className="brief-promo">
      <h2>Two briefs a day</h2>
      <p>The Morning Briefing at 6:50 AM Pacific consolidates the last 24 hours. The Evening Daily Brief at 5:25 PM is written by an analyst agent, grades its own forecasts, and is audited before it goes out.</p>
      <Link to="/intelligence" className="btn primary sm">Open the briefs</Link>
    </section>
  );
}
