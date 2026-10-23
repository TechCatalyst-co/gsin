import { Link } from 'react-router-dom';
import { Fragment } from 'react';
import AdSlot from './AdSlot';
import { categoryMeta } from '../brand';
import { storyPath, timeAgo } from '../format';
import { isSafeHttpUrl } from '../url';

const isBreaking = (item) => item.urgencyTier === 1 || item.urgent;

// One line under every headline: breaking flag, desk, source, age, comments.
function Meta({ item, showCategory = true }) {
  const desk = showCategory && item.category ? categoryMeta(item.category) : null;
  return (
    <div className="meta">
      {isBreaking(item) && <span className="flag-breaking">Breaking</span>}
      {desk && <span className="meta-desk"><span className="cat-dot" style={{ background: desk.hue }} aria-hidden="true" />{desk.short}</span>}
      <span className="meta-source">{item.source}</span>
      <time dateTime={item.published}>{timeAgo(item.published)}</time>
      {item.commentCount > 0 && <span className="meta-comments">{item.commentCount} comment{item.commentCount === 1 ? '' : 's'}</span>}
    </div>
  );
}

// The lead story: the biggest type on the page, its impact, and the two actions.
export function StoryLead({ item }) {
  if (!item) return null;
  const hasSource = isSafeHttpUrl(item.url);
  return (
    <article className="lead">
      <div className="lead-text">
        <h1 className="lead-title"><Link to={storyPath(item)}>{item.title}</Link></h1>
        {(item.impact || item.headline || item.summary) && <p className="lead-dek">{item.impact || item.headline || item.summary}</p>}
        <Meta item={item} />
        <div className="lead-actions">
          <Link to={storyPath(item)} className="btn primary sm">Open the story</Link>
          {hasSource && <a className="btn ghost sm" href={item.url} target="_blank" rel="noopener noreferrer">Read the original source ↗</a>}
        </div>
      </div>
      {item.imageUrl && (
        <Link to={storyPath(item)} className="lead-media" tabIndex={-1} aria-hidden="true">
          <img src={item.imageUrl} alt="" loading="eager" />
        </Link>
      )}
    </article>
  );
}

// Standard row in a list: tier rail, headline, impact, one meta line.
export function StoryRow({ item, showCategory = true, compact = false }) {
  const tier = item.urgencyTier || (item.urgent ? 1 : 3);
  return (
    <article className={`row t${tier}${compact ? ' row--compact' : ''}`}>
      <div className="row-text">
        <h3 className="row-title">
          <Link to={storyPath(item)}>{item.title}</Link>
        </h3>
        {!compact && (item.impact || item.headline || item.summary) && <p className="row-dek">{item.impact || item.headline || item.summary}</p>}
        <Meta item={item} showCategory={showCategory} />
      </div>
      {!compact && item.imageUrl && (
        <Link to={storyPath(item)} className="row-thumb" tabIndex={-1} aria-hidden="true">
          <img src={item.imageUrl} alt="" loading="lazy" />
        </Link>
      )}
    </article>
  );
}

export function StoryList({ items, empty = 'No stories yet.', adEvery = 0, adPlacement = 'feed-inline', ...rest }) {
  if (!items?.length) return <p className="muted empty-line">{empty}</p>;
  return (
    <div className="rows">
      {items.map((i, n) => (
        <Fragment key={i._id}>
          <StoryRow item={i} {...rest} />
          {adEvery > 0 && (n + 1) % adEvery === 0 && n < items.length - 1 && <AdSlot placement={adPlacement} />}
        </Fragment>
      ))}
    </div>
  );
}
