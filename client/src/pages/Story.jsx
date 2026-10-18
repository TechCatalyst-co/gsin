import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../auth/AuthContext';
import { BRAND, TIER_MEANING, TIER_NAME, domainShort } from '../brand';
import { ItemChips, LabelChip } from '../components/Chips';
import { InstrumentStrip, SignalGauge } from '../components/Signal';
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

  if (error) return <div className="shell"><div className="empty"><h1>Story not found</h1><p>{error}</p><Link to="/" className="btn primary sm">Back to the news</Link></div></div>;
  if (!data) return <div className="center muted">Opening the story…</div>;
  const { item, related } = data;
  const hasSource = isSafeHttpUrl(item.url);
  const graded = item.urgencyTier != null;

  return (
    <div className="shell">
      <article className="story">
        <header className="story-head">
          <div className="story-kicker"><ItemChips item={item} /></div>
          <h1 className="story-title">{item.title}</h1>
          {item.headline && item.headline !== item.title && <p className="story-dek">{item.headline}</p>}
          <div className="story-byline">
            <span>{item.author ? `${item.author}, ` : ''}{item.source}</span>
            <time dateTime={item.published}>{longDate(item.published)}</time>
            {item.kind && <span>{item.kind}</span>}
          </div>
          {graded && <InstrumentStrip item={item} />}
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

          <section className={`verified${item.primarySource ? '' : ' reported'}`} aria-label="Source">
            <h2>
              <svg width="18" height="18" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true" style={{ color: item.primarySource ? 'var(--blue)' : 'var(--slate)' }}>
                <path d="M11 2.5l7 2.6v5.4c0 4.3-2.9 7.6-7 9-4.1-1.4-7-4.7-7-9V5.1z" />{item.primarySource && <path d="M7.8 11l2.2 2.2 4.2-4.4" />}
              </svg>
              {item.primarySource ? 'Verified source' : 'Reported source'}
            </h2>
            <p>{item.source} published this {longDate(item.published)}.{item.capturedAt ? ` The radar captured it ${timeAgo(item.capturedAt)}.` : ''}</p>
            {hasSource && <a className="btn primary sm" href={item.url} target="_blank" rel="noopener noreferrer" style={{ alignSelf: 'flex-start' }}>Read the original source ↗</a>}
            {graded && <p className="small muted" style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>The headline, impact and plain-English lines above are <LabelChip kind="analysis" /></p>}
          </section>

          {item.analysis && <AdSlot placement="story-inline" />}
          {item.analysis && (
            <section className="analysis">
              <h2>Analysis</h2>
              {item.analysis.split(/\n{2,}/).map((p, i) => <p key={i}>{p}</p>)}
            </section>
          )}

          {item.entities?.length > 0 && (
            <div className="entities" aria-label="Named in this story">
              {item.entities.map((e) => <Link key={e} to={`/search?q=${encodeURIComponent(e)}`} className="chip">{e}</Link>)}
            </div>
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

          {graded && (
            <section className="grading" aria-labelledby="grade-h">
              <div className="grading-head">
                <SignalGauge score={item.signalScore} />
                <div>
                  <h2 id="grade-h">How this was graded</h2>
                  <p className="grading-sub">Relevance, freshness, primary source and corroboration, scored 0 to 100 and enforced in code.</p>
                </div>
              </div>
              <dl>
                <dt>Tier</dt><dd>T{item.urgencyTier} {TIER_NAME[item.urgencyTier]}. {TIER_MEANING[item.urgencyTier]}</dd>
                <dt>Signal</dt><dd>{item.signalScore} of 100{item.relevance != null ? ` (relevance ${item.relevance})` : ''}</dd>
                <dt>Source</dt><dd>{item.primarySource ? 'Verified primary source: the acting party published it.' : 'Reported by a publisher, not the acting party.'}</dd>
                <dt>Desk</dt><dd>{[item.category, ...(item.dimensions || [])].filter(Boolean).filter((v, i, a) => a.indexOf(v) === i).map(domainShort).join(', ')}</dd>
                {item.geo && <><dt>Region</dt><dd>{item.geo}</dd></>}
                {item.horizon && <><dt>Horizon</dt><dd>{item.horizon}</dd></>}
                {captures.length > 0 && <><dt>Coverage</dt><dd>{captures.length + 1} captures of this story</dd></>}
              </dl>
              <p className="small muted" style={{ margin: '10px 0 0' }}><Link to="/about">The full rubric</Link></p>
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
