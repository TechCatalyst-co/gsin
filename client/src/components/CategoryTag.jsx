import { Link } from 'react-router-dom';
import { categoryMeta, CATEGORIES } from '../brand';

export default function CategoryTag({ name, link = true }) {
  if (!name) return null;
  const meta = categoryMeta(name);
  const inner = (
    <>
      <span className="cat-dot" style={{ background: meta.hue }} aria-hidden="true" />
      {meta.name}
    </>
  );
  const known = CATEGORIES.some((c) => c.name === meta.name);
  const to = known ? `/topic/${meta.slug}` : `/topic/${meta.slug}?name=${encodeURIComponent(meta.name)}`;
  return link
    ? <Link className="cat" to={to}>{inner}</Link>
    : <span className="cat">{inner}</span>;
}
