import { useEffect, useState } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { api } from '../api';
import { BRAND, categoryFromSlug, categoryMeta } from '../brand';
import { StoryList } from '../components/Story';
import { useDocumentTitle } from './Home';

const SORTS = [
  { key: 'latest', label: 'Latest' },
  { key: 'relevance', label: 'Biggest signal' },
  { key: 'discussed', label: 'Most discussed' },
];

// Shared by /topic/:slug and /search — both are a filtered feed.
export function FeedPage({ title, intro, query }) {
  const [params, setParams] = useSearchParams();
  const sort = params.get('sort') || 'latest';
  const page = Math.max(1, Number(params.get('page')) || 1);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const qs = new URLSearchParams({ ...query, sort, page: String(page), limit: '25' }).toString();

  useEffect(() => {
    setData(null);
    api(`/news?${qs}`).then(setData).catch((e) => setError(e.message));
  }, [qs]);

  const setParam = (k, v) => {
    const next = new URLSearchParams(params);
    next.set(k, v);
    if (k !== 'page') next.delete('page');
    setParams(next);
  };

  return (
    <div className="shell feed">
      <header className="feed-head">
        <h1>{title}</h1>
        {intro && <p className="feed-intro">{intro}</p>}
        <div className="sorts" role="group" aria-label="Sort stories">
          {SORTS.map((s) => (
            <button key={s.key} className={`sort${sort === s.key ? ' is-on' : ''}`} aria-pressed={sort === s.key} onClick={() => setParam('sort', s.key)}>
              {s.label}
            </button>
          ))}
        </div>
      </header>
      {error && <div className="alert">{error}</div>}
      {!data ? <div className="center muted">Loading…</div> : (
        <>
          <StoryList items={data.items} empty="No stories match yet. Try a broader search." />
          {data.pagination.totalPages > 1 && (
            <nav className="pager" aria-label="Pages">
              <button className="btn ghost sm" disabled={page <= 1} onClick={() => setParam('page', String(page - 1))}>Newer</button>
              <span className="muted">Page {page} of {data.pagination.totalPages}</span>
              <button className="btn ghost sm" disabled={page >= data.pagination.totalPages} onClick={() => setParam('page', String(page + 1))}>Older</button>
            </nav>
          )}
        </>
      )}
    </div>
  );
}

export default function Topic() {
  const { slug } = useParams();
  const [params] = useSearchParams();
  // Unknown desks (any category n8n sends) carry their exact name in ?name=.
  const name = categoryFromSlug(slug) || params.get('name') || slug.replace(/-/g, ' ');
  const meta = categoryMeta(name);
  useDocumentTitle(`${meta.name} — ${BRAND.name}`);
  return (
    <FeedPage
      key={slug}
      title={<><span className="cat-dot cat-dot--lg" style={{ background: meta.hue }} aria-hidden="true" />{meta.name}</>}
      intro={<span className="feed-links"><a href={`/api/v1/public/rss?category=${encodeURIComponent(meta.name)}`}>RSS for this topic</a><Link to="/account">Follow topics</Link></span>}
      query={{ category: meta.name }}
    />
  );
}

export function Search() {
  const [params] = useSearchParams();
  const q = params.get('q') || '';
  const tag = params.get('tag') || '';
  useDocumentTitle(`${q ? `“${q}”` : tag ? `#${tag}` : 'All stories'} — ${BRAND.name}`);
  const query = {};
  if (q) query.search = q;
  if (tag) query.tag = tag;
  return (
    <FeedPage
      key={`${q}|${tag}`}
      title={q ? `Results for “${q}”` : tag ? `#${tag}` : 'All stories'}
      query={query}
    />
  );
}
