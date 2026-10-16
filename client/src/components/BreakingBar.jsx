import { Link } from 'react-router-dom';
import { storyPath, timeAgo } from '../format';

export default function BreakingBar({ items = [] }) {
  if (!items.length) return null;
  return (
    <section className="breaking" aria-label="Breaking news">
      <div className="shell breaking-row">
        <span className="breaking-label"><span className="pulse" aria-hidden="true" />Breaking</span>
        <ul>
          {items.map((i) => (
            <li key={i._id}>
              <Link to={storyPath(i)}>{i.title}</Link>
              <span className="breaking-time">{timeAgo(i.published)}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
