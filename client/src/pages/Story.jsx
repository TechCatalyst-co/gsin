import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../auth/AuthContext';
import { BRAND, categoryMeta } from '../brand';
import ShareButton from '../components/ShareButton';
import BookmarkButton from '../components/BookmarkButton';
import CommentsPanel from '../components/Comments';
import AdSlot from '../components/AdSlot';
import { StoryRow } from '../components/Story';
import { longDate, storyPath, timeAgo } from '../format';
import { isSafeHttpUrl } from '../url';
import { useDocumentTitle } from './Home';

export default function Story() {
  const { slug } = useParams();
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [captures, setCaptures] = useState([]);
  const [error, setError] = useState('');
  useDocumentTitle(data?.item ? `${data.item.title} — ${BRAND.name}` : BRAND.name);

  useEffect(() => {
    setData(null);
    setCaptures([]);
    setError('');
    api(`/news/${encodeURIComponent(slug)}`)
      .then((d) => {
        setData(d);
        if (d.item?.storyKey) api(`/news/story/${encodeURIComponent(d.item.storyKey)}`).then((g) => setCaptures((g.captures || []).filter((c) => c._id !== d.item._id))).catch(() => {});
      })
      .catch((e) => setError(e.status === 404 ? 'This story is no longer available.' : e.message));
    window.scrollTo(0, 0);
  }, [slug, user?.id]);

  if (error) return <div className="shell"><div className="empty"><h1>Story not found</h1><p>{error}</p><Link to="/news" className="btn primary sm">Back to the news</Link></div></div>;
  if (!data) return <div className="center muted">Opening the story…</div>;
  const { item, related } = data;
  const hasSource = isSafeHttpUrl(item.url);
  const graded = item.urgencyTier != null;

  return (
    <div className="shell">
      <article className="story">
        <header className="story-head">
          <div className="story-kicker">
            {(item.urgencyTier === 1 || item.urgent) && <span className="flag-breaking">Breaking</span>}
            {item.category && <Link to={`/topic/${categoryMeta(item.category).slug}`} className="meta-desk"><span className="cat-dot" style={{ background: categoryMeta(item.category).hue }} aria-hidden="true" />{categoryMeta(item.category).name}</Link>}
          </div>
          <h1 className="story-title">{item.title}</h1>
          {item.headline && item.headline !== item.title && <p className="story-dek">{item.headline}</p>}
          <div className="story-byline">
            <span>{item.author ? `${item.author}, ` : ''}{item.source}</span>
            <time dateTime={item.published}>{longDate(item.published)}</time>
          </div>
          <div className="story-actions">
            {hasSource && <a className="btn primary sm" href={item.url} target="_blank" rel="noopener noreferrer">Read the original source ↗</a>}
            <BookmarkButton key={item._id} id={item._id} initial={!!item.bookmarked} />
            <ShareButton path={storyPath(item)} title={item.title} />
          </div>
        </header>

        {item.imageUrl && <figure className="story-media"><img src={item.imageUrl} alt="" /></figure>}

        <div className="story-body">
          {item.impact && <p className="story-summary">{item.impact}</p>}
          {item.summary && item.summary !== item.impact && <p className="story-summary">{item.summary}</p>}
          {item.industryLine && (
            <section className="why plain">
              <h2>✦&nbsp;&nbsp;In plain English</h2>
              <p>{item.industryLine}</p>
            </section>
          )}
          {item.whoCares && (
            <section className="why">
              <h2>Who this affects</h2>
              <p>{item.whoCares}</p>
            </section>
          )}
          {item.updateType === 'escalation' && item.whatIsNew && (
            <section className="why">
              <h2>What is new</h2>
              <p>{item.whatIsNew}</p>
            </section>
          )}
          {!item.impact && !item.industryLine && item.summary == null && <p className="muted">No summary yet.</p>}

          <p className="story-source">
            {item.primarySource ? 'Verified primary source: ' : 'Reported by '}{item.source}, {longDate(item.published)}.
            {graded && ' Summary lines are AI-generated. '}
            {graded && <Link to="/about">How stories are graded</Link>}
          </p>

          {item.analysis && <AdSlot placement="story-inline" />}
          {item.analysis && (
            <section className="analysis">
              <h2>Analysis</h2>
              {item.analysis.split(/\n{2,}/).map((p, i) => <p key={i}>{p}</p>)}
            </section>
          )}

          {captures.length > 0 && (
            <section className="captures" aria-labelledby="cap-h">
              <h2 id="cap-h">Other captures of this story</h2>
              {captures.map((c) => (
                <Link key={c._id} to={storyPath(c)}>
                  {c.title}
                  <small>{c.source} · {c.updateType === 'echo' ? 'repeat coverage' : c.updateType || 'capture'} · {timeAgo(c.published)}</small>
                </Link>
              ))}
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
