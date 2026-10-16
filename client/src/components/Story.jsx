import { Link } from 'react-router-dom';
import CategoryTag from './CategoryTag';
import SignalMeter from './SignalMeter';
import { storyPath, timeAgo } from '../format';

function Meta({ item, showCategory = true }) {
  return (
    <div className="meta">
      {showCategory && <CategoryTag name={item.category} />}
      <span className="meta-source">{item.source}</span>
      <time dateTime={item.published}>{timeAgo(item.published)}</time>
      {item.commentCount > 0 && <span className="meta-comments">{item.commentCount} comment{item.commentCount === 1 ? '' : 's'}</span>}
    </div>
  );
}

// The lead story: the biggest type on the page.
export function StoryLead({ item }) {
  if (!item) return null;
  return (
    <article className="lead">
      <div className="lead-text">
        <div className="lead-signal">
          <SignalMeter value={item.relevance} size="lg" />
          {item.urgent && <span className="flag-breaking">Breaking</span>}
        </div>
        <h1 className="lead-title"><Link to={storyPath(item)}>{item.title}</Link></h1>
        {(item.headline || item.summary) && <p className="lead-dek">{item.headline || item.summary}</p>}
        <Meta item={item} />
      </div>
      {item.imageUrl && (
        <Link to={storyPath(item)} className="lead-media" tabIndex={-1} aria-hidden="true">
          <img src={item.imageUrl} alt="" loading="eager" />
        </Link>
      )}
    </article>
  );
}

// Standard row in a list: signal meter in the gutter, thumbnail on the right.
export function StoryRow({ item, showCategory = true, compact = false }) {
  return (
    <article className={`row${compact ? ' row--compact' : ''}`}>
      <SignalMeter value={item.relevance} />
      <div className="row-text">
        <h3 className="row-title">
          {item.urgent && <span className="flag-breaking">Breaking</span>}
          <Link to={storyPath(item)}>{item.title}</Link>
        </h3>
        {!compact && (item.headline || item.summary) && <p className="row-dek">{item.headline || item.summary}</p>}
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

export function StoryList({ items, empty = 'No stories yet.', ...rest }) {
  if (!items?.length) return <p className="muted empty-line">{empty}</p>;
  return <div className="rows">{items.map((i) => <StoryRow key={i._id} item={i} {...rest} />)}</div>;
}
