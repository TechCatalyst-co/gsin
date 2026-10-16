import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../auth/AuthContext';
import { BRAND } from '../brand';
import CategoryTag from '../components/CategoryTag';
import ShareButton from '../components/ShareButton';
import BookmarkButton from '../components/BookmarkButton';
import CommentsPanel from '../components/Comments';
import AdSlot from '../components/AdSlot';
import { StoryRow } from '../components/Story';
import { longDate, storyPath } from '../format';
import { isSafeHttpUrl } from '../url';
import { useDocumentTitle } from './Home';

export default function Story() {
  const { slug } = useParams();
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  useDocumentTitle(data?.item ? `${data.item.title} — ${BRAND.short}` : BRAND.name);

  useEffect(() => {
    setData(null);
    setError('');
    api(`/news/${encodeURIComponent(slug)}`).then(setData).catch((e) => setError(e.status === 404 ? 'This story is no longer available.' : e.message));
    window.scrollTo(0, 0);
  }, [slug, user?.id]);

  if (error) return <div className="shell"><div className="empty"><h1>Story not found</h1><p>{error}</p><Link to="/" className="btn primary sm">Back to top stories</Link></div></div>;
  if (!data) return <div className="center muted">Loading…</div>;
  const { item, related } = data;
  const hasSource = isSafeHttpUrl(item.url);

  return (
    <div className="shell">
      <article className="story">
        <header className="story-head">
          <div className="story-kicker">
            <CategoryTag name={item.category} />
            {item.urgent && <span className="flag-breaking">Breaking</span>}
          </div>
          <h1 className="story-title">{item.title}</h1>
          {item.headline && <p className="story-dek">{item.headline}</p>}
          <div className="story-byline">
            <span>{item.author ? `${item.author}, ` : ''}{item.source}</span>
            <time dateTime={item.published}>{longDate(item.published)}</time>
          </div>
          <div className="story-actions">
            {hasSource && <a className="btn primary sm" href={item.url} target="_blank" rel="noopener noreferrer">Read at {item.source}</a>}
            <BookmarkButton key={item._id} id={item._id} initial={!!item.bookmarked} />
            <ShareButton path={storyPath(item)} title={item.title} />
          </div>
        </header>

        {item.imageUrl && <figure className="story-media"><img src={item.imageUrl} alt="" /></figure>}

        <div className="story-body">
          {item.summary && <p className="story-summary">{item.summary}</p>}
          {item.impact && (
            <section className="why">
              <h2>Why it matters</h2>
              <p>{item.impact}</p>
            </section>
          )}
          {item.analysis && <AdSlot placement="story-inline" />}
          {item.analysis && (
            <section className="analysis">
              <h2>Analysis</h2>
              {item.analysis.split(/\n{2,}/).map((p, i) => <p key={i}>{p}</p>)}
            </section>
          )}
          {item.tags?.length > 0 && (
            <div className="tags">
              {item.tags.map((t) => <Link key={t} to={`/search?tag=${encodeURIComponent(t)}`} className="tag">#{t}</Link>)}
            </div>
          )}
        </div>

        <AdSlot placement="story-end" />

        <section className="discussion" aria-labelledby="disc">
          <h2 id="disc" className="section-h">Discussion</h2>
          <CommentsPanel newsItemId={item._id} />
        </section>
      </article>

      {related.length > 0 && (
        <aside className="related" aria-labelledby="rel">
          <h2 id="rel" className="section-h">Related</h2>
          <div className="rows">{related.map((r) => <StoryRow key={r._id} item={r} />)}</div>
        </aside>
      )}
    </div>
  );
}
