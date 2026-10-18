import { Link } from 'react-router-dom';
import { storyPath } from '../format';

// Live headline ticker under the masthead: the top stories moving across. Pauses on hover.
export default function Ticker({ items }) {
  const list = (items || []).slice(0, 8);
  if (!list.length) return null;
  const row = (dup) => (
    <div className="ticker-row" aria-hidden={dup || undefined}>
      {list.map((it) => (
        <Link key={it._id + (dup ? '-d' : '')} to={storyPath(it)} className="ticker-item" tabIndex={dup ? -1 : 0}>
          <span className={`ticker-tier t${it.urgencyTier || (it.urgent ? 1 : 3)}`}>T{it.urgencyTier || (it.urgent ? 1 : 3)}</span>
          <span className="ticker-head">{it.title}</span>
          <span className="ticker-src">{it.source}</span>
        </Link>
      ))}
    </div>
  );
  return (
    <div className="ticker" role="marquee" aria-label="Latest headlines">
      <div className="ticker-track">{row(false)}{row(true)}</div>
    </div>
  );
}
