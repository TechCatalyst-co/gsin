import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../auth/AuthContext';
import { BRAND } from '../brand';
import BreakingBar from '../components/BreakingBar';
import { StoryLead, StoryList, StoryRow } from '../components/Story';
import { storyPath } from '../format';

function useDocumentTitle(title) {
  useEffect(() => {
    document.title = title;
  }, [title]);
}

export { useDocumentTitle };

export default function Home() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [tags, setTags] = useState([]);
  const [error, setError] = useState('');
  useDocumentTitle(`${BRAND.name} — AI and superintelligence news`);

  useEffect(() => {
    api('/news/front-page').then(setData).catch((e) => setError(e.message));
    api('/news/tags').then((d) => setTags(d.tags || [])).catch(() => {});
  }, [user?.id]);

  if (error) return <div className="shell"><div className="alert">{error}</div></div>;
  if (!data) return <div className="center muted">Loading the wire…</div>;

  const { breaking, lead, featured, latest, mostDiscussed } = data;
  const isEmpty = !lead;

  return (
    <>
      <BreakingBar items={breaking} />
      <div className="shell">
        {isEmpty ? (
          <div className="empty">
            <h1>The wire is quiet</h1>
            <p>No stories have arrived yet. Once the n8n workflow posts to the news endpoint, they appear here within a minute.</p>
          </div>
        ) : (
          <>
            <StoryLead item={lead} />
            <div className="front">
              <section className="front-main" aria-labelledby="latest-h">
                {featured.length > 0 && (
                  <div className="picks">
                    <h2 className="section-h">Editors’ picks</h2>
                    <div className="picks-grid">
                      {featured.slice(0, 3).map((i) => <StoryRow key={i._id} item={i} compact />)}
                    </div>
                  </div>
                )}
                <h2 id="latest-h" className="section-h">Latest</h2>
                <StoryList items={latest} />
                <Link to="/search" className="more-link">Browse all stories</Link>
              </section>

              <aside className="front-side">
                <BriefPromo user={user} />
                {mostDiscussed.length > 0 && (
                  <section className="side-block" aria-labelledby="disc-h">
                    <h2 id="disc-h" className="section-h">Most discussed this week</h2>
                    <ol className="ranked">
                      {mostDiscussed.map((i) => (
                        <li key={i._id}>
                          <Link to={storyPath(i)}>{i.title}</Link>
                          <span className="muted">{i.commentCount} comments</span>
                        </li>
                      ))}
                    </ol>
                  </section>
                )}
                {tags.length > 0 && (
                  <section className="side-block" aria-labelledby="tags-h">
                    <h2 id="tags-h" className="section-h">Trending this week</h2>
                    <div className="tags">
                      {tags.slice(0, 14).map((t) => (
                        <Link key={t.tag} to={`/search?tag=${encodeURIComponent(t.tag)}`} className="tag">#{t.tag}</Link>
                      ))}
                    </div>
                  </section>
                )}
              </aside>
            </div>
          </>
        )}
      </div>
    </>
  );
}

function BriefPromo({ user }) {
  if (user?.capabilities?.accessDailyBrief) {
    return (
      <section className="brief-promo">
        <h2>Today’s Daily Brief is ready</h2>
        <p>The day in AI, summarized in five minutes.</p>
        <Link to="/brief" className="btn primary sm">Read the brief</Link>
      </section>
    );
  }
  return (
    <section className="brief-promo">
      <h2>The Daily Brief</h2>
      <p>Every morning: the stories that moved AI forward, why they matter, and what to watch next. Included with Premium.</p>
      <Link to="/premium" className="btn primary sm">Get Premium for {BRAND.premiumPrice}/mo</Link>
    </section>
  );
}
