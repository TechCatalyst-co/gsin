import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api';
import { timeAgo } from '../../format';

export default function AdminOverview() {
  const [m, setM] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => { api('/admin/metrics').then(setM).catch((e) => setError(e.message)); }, []);
  if (error) return <div className="alert">{error}</div>;
  if (!m) return <div className="center muted">Loading…</div>;

  const stale = !m.lastIngestAt || Date.now() - new Date(m.lastIngestAt) > 6 * 60 * 60 * 1000;
  const maxCat = Math.max(1, ...m.byCategory.map((c) => c.count));

  return (
    <div className="overview">
      <p className={`pipeline ${stale ? 'pipeline--stale' : ''}`} role="status">
        {m.lastIngestAt
          ? <>Last story from n8n arrived {timeAgo(m.lastIngestAt)}.{stale && ' The workflow may be paused or failing.'}</>
          : 'No stories received from n8n yet.'}
      </p>
      <div className="stats">
        <Stat label="Stories in the last 24 hours" value={m.stories24h} />
        <Stat label="Stories this week" value={m.stories7d} />
        <Stat label="Breaking in 24 hours" value={m.breaking24h} />
        <Stat label="Brief email subscribers" value={m.briefSubscribers} />
        <Stat label="All accounts" value={m.totalMembers} />
        <Stat label="New accounts, 30 days" value={m.newMembers30d} />
        <Stat label="Comments this week" value={m.comments7d} />
        <Stat label="Reports waiting" value={m.openReports} link={m.openReports ? '/admin/moderation' : null} />
      </div>
      <div className="overview-cols">
        <section>
          <h2 className="section-h">Stories by topic, last 7 days</h2>
          {m.byCategory.length === 0 ? <p className="muted">None yet.</p> : (
            <ul className="bars">
              {m.byCategory.map((c) => (
                <li key={c.category}>
                  <span>{c.category}</span>
                  <span className="bar"><span style={{ width: `${(c.count / maxCat) * 100}%` }} /></span>
                  <span className="bar-n">{c.count}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
        <section>
          <h2 className="section-h">Most discussed</h2>
          {m.topStories.length === 0 ? <p className="muted">No discussion yet.</p> : (
            <ol className="ranked">
              {m.topStories.map((s) => (
                <li key={s._id}><Link to={`/story/${s.slug || s._id}`}>{s.title}</Link><span className="muted">{s.commentCount} comments</span></li>
              ))}
            </ol>
          )}
          <p className="muted small">Daily briefs published: {m.briefs}{m.latestBrief ? `, latest ${m.latestBrief.briefingDateLabel}` : ''}</p>
        </section>
      </div>
    </div>
  );
}

function Stat({ label, value, link }) {
  const body = <><span className="stat-n">{value}</span><span className="stat-l">{label}</span></>;
  return link ? <Link to={link} className="stat stat--link">{body}</Link> : <div className="stat">{body}</div>;
}
