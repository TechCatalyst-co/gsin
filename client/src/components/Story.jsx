import { Link } from 'react-router-dom';
import { Fragment } from 'react';
import AdSlot from './AdSlot';
import { ItemChips } from './Chips';
import { InstrumentStrip, SignalMeter } from './Signal';
import { storyPath, timeAgo } from '../format';
import { isSafeHttpUrl } from '../url';

function Meta({ item, showSignal = false }) {
  return (
    <div className="meta">
      <span className="meta-source">{item.source}</span>
      <time dateTime={item.published}>{timeAgo(item.published)}</time>
      {item.kind && <span>{item.kind}</span>}
      {item.sourceCount > 1 && <span>{item.sourceCount} sources</span>}
      {item.commentCount > 0 && <span className="meta-comments">{item.commentCount} comment{item.commentCount === 1 ? '' : 's'}</span>}
      {showSignal && item.signalScore != null && <SignalMeter score={item.signalScore} tier={item.urgencyTier || 3} />}
    </div>
  );
}

// The lead story as an instrument panel: chips, the biggest type on the page, impact,
// plain English, the four readings, and the two actions.
export function StoryLead({ item }) {
  if (!item) return null;
  const hasSource = isSafeHttpUrl(item.url);
  return (
    <article className="lead">
      <div className="lead-text">
        <div className="lead-flags"><ItemChips item={item} /></div>
        <h1 className="lead-title"><Link to={storyPath(item)}>{item.title}</Link></h1>
        {(item.impact || item.headline || item.summary) && <p className="lead-dek">{item.impact || item.headline || item.summary}</p>}
        {item.industryLine && <section className="why plain"><h2>✦&nbsp;&nbsp;In plain English</h2><p>{item.industryLine}</p></section>}
        {(item.signalScore != null) && <InstrumentStrip item={item} />}
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

// Standard row in a list: tier rail, chips, headline, impact, meta with the signal meter.
export function StoryRow({ item, showCategory = true, compact = false }) {
  const tier = item.urgencyTier || (item.urgent ? 1 : 3);
  return (
    <article className={`row t${tier}${compact ? ' row--compact' : ''}`}>
      <div className="row-text">
        {!compact && <div className="row-chips"><ItemChips item={item} /></div>}
        <h3 className="row-title">
          {compact && item.urgent && <span className="flag-breaking">Breaking</span>}
          <Link to={storyPath(item)}>{item.title}</Link>
        </h3>
        {!compact && (item.impact || item.headline || item.summary) && <p className="row-dek">{item.impact || item.headline || item.summary}</p>}
        <Meta item={item} showSignal={!compact} />
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
