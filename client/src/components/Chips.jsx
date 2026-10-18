import { Link } from 'react-router-dom';
import { categoryMeta, CATEGORIES, TIER_NAME } from '../brand';

// Grading chips: tier, desk, direction, source verification, horizon. Blue is reserved
// for T1 and actions; gold never appears on a chip (the style guide keeps it for the wordmark).
export function TierChip({ item }) {
  const t = item.urgencyTier || (item.urgent ? 1 : null);
  if (!t) return null;
  return <span className={`chip t${t}`}>T{t} {TIER_NAME[t]}</span>;
}

export function DomainChip({ name }) {
  if (!name) return null;
  const meta = categoryMeta(name);
  const known = CATEGORIES.some((c) => c.name === meta.name);
  const to = known ? `/topic/${meta.slug}` : `/topic/${meta.slug}?name=${encodeURIComponent(meta.name)}`;
  return <Link className="chip" to={to}>{meta.short}</Link>;
}

export function ItemChips({ item, showTier = true }) {
  return (
    <div className="chips">
      {showTier && <TierChip item={item} />}
      <DomainChip name={item.category} />
      {item.direction === 'threat' && <span className="chip thr">Threat</span>}
      {item.direction === 'advance' && <span className="chip adv">Advance</span>}
      {item.primarySource ? <span className="chip ver">Verified primary source</span> : item.urgencyTier ? <span className="chip">Reported</span> : null}
      {item.horizon === 'upcoming' && <span className="chip">Upcoming</span>}
    </div>
  );
}

export function LabelChip({ kind }) {
  const text = kind === 'analysis' ? 'AI-generated analysis' : kind === 'forecast' ? 'Speculative forecast' : 'Verified reporting';
  return <span className="chip label">{text}</span>;
}
