import { useState } from 'react';
import { categoryMeta } from '../brand';

function Chevron() {
  return (
    <svg className="fold-chev" width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
      <path d="M5 3l4 4-4 4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// A collapsible section: one row with a title, a count and, while closed, a one-line teaser.
export function Fold({ title, count, teaser, dot, defaultOpen = false, children }) {
  return (
    <details className="fold" open={defaultOpen || undefined}>
      <summary className="fold-head">
        <Chevron />
        <span className="fold-title">
          {dot && <span className="cat-dot" style={{ background: dot }} aria-hidden="true" />}
          {title}
          {count != null && <span className="fold-count">{count}</span>}
        </span>
        {teaser && <span className="fold-teaser">{teaser}</span>}
      </summary>
      <div className="fold-body">{children}</div>
    </details>
  );
}

// Long sections show this many items, then a "Show all" button.
const PREVIEW = 5;

function Group({ name, items, render, defaultOpen }) {
  const [all, setAll] = useState(false);
  const meta = categoryMeta(name);
  const shown = all ? items : items.slice(0, PREVIEW);
  return (
    <Fold title={meta.name} count={items.length} teaser={items[0]?.title} dot={meta.hue} defaultOpen={defaultOpen}>
      {render(shown)}
      {items.length > PREVIEW && !all && (
        <button type="button" className="fold-more" onClick={() => setAll(true)}>Show all {items.length}</button>
      )}
    </Fold>
  );
}

// Items grouped by desk, busiest desk first and open; the rest closed with a teaser.
// `render` receives one group's visible items and returns their list.
export function TopicGroups({ items, render }) {
  const groups = new Map();
  for (const it of items) {
    const key = it.category || 'Other';
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(it);
  }
  const sorted = [...groups.entries()].sort((a, b) => b[1].length - a[1].length);
  return (
    <div className="folds">
      {sorted.map(([name, xs], n) => <Group key={name} name={name} items={xs} render={render} defaultOpen={n === 0} />)}
    </div>
  );
}
