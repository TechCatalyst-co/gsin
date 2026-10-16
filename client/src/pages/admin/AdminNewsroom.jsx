import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api';
import { timeAgo } from '../../format';

const FILTERS = [
  { key: '', label: 'All' },
  { key: 'featured', label: 'Picks' },
  { key: 'urgent', label: 'Breaking' },
  { key: 'hidden', label: 'Hidden' },
];

export default function AdminNewsroom() {
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState('');
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const qs = new URLSearchParams({ page: String(page) });
    if (filter) qs.set('filter', filter);
    if (query) qs.set('search', query);
    api(`/admin/news?${qs}`).then((d) => { setItems(d.items); setPagination(d.pagination); }).catch((e) => setError(e.message));
  }, [page, filter, query]);

  const patch = async (item, body) => {
    setBusy(item._id);
    setError('');
    try {
      const { item: next } = await api(`/admin/news/${item._id}`, { method: 'PATCH', body });
      setItems((prev) => prev.map((i) => (i._id === item._id ? { ...i, ...next } : i)));
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy('');
    }
  };

  return (
    <>
      <div className="toolbar">
        <div className="sorts" role="group" aria-label="Filter stories">
          {FILTERS.map((f) => (
            <button key={f.key} className={`sort${filter === f.key ? ' is-on' : ''}`} aria-pressed={filter === f.key} onClick={() => { setPage(1); setFilter(f.key); }}>{f.label}</button>
          ))}
        </div>
        <form onSubmit={(e) => { e.preventDefault(); setPage(1); setQuery(search.trim()); }} role="search">
          <input type="search" placeholder="Search title, source, topic" aria-label="Search stories" value={search} onChange={(e) => setSearch(e.target.value)} />
        </form>
      </div>
      {error && <div className="alert">{error}</div>}
      <p className="muted small">Picks lead the front page. Breaking shows in the red bar for 24 hours. Hidden stories are removed from every public view; n8n re-ingests never unhide them.</p>
      <div className="table-wrap">
        <table className="admin-table">
          <thead><tr><th>Story</th><th>Topic</th><th>Pick</th><th>Breaking</th><th>Hidden</th></tr></thead>
          <tbody>
            {items.map((i) => (
              <tr key={i._id} className={i.hidden ? 'is-hidden' : ''}>
                <td>
                  <Link to={`/story/${i.slug || i._id}`}>{i.title}</Link>
                  <div className="muted small">{i.source}, {timeAgo(i.published)}{i.commentCount ? `, ${i.commentCount} comments` : ''}</div>
                </td>
                <td>{i.category || <span className="muted">None</span>}</td>
                {['featured', 'urgent', 'hidden'].map((k) => (
                  <td key={k}>
                    <input type="checkbox" aria-label={`${k} ${i.title}`} checked={!!i[k]} disabled={busy === i._id} onChange={(e) => patch(i, { [k]: e.target.checked })} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {pagination && pagination.totalPages > 1 && (
        <nav className="pager">
          <button className="btn ghost sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>Newer</button>
          <span className="muted">Page {page} of {pagination.totalPages}</span>
          <button className="btn ghost sm" disabled={page >= pagination.totalPages} onClick={() => setPage(page + 1)}>Older</button>
        </nav>
      )}
    </>
  );
}
