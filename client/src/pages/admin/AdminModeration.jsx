import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api';

const fmt = (d) => new Date(d).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });

export default function AdminModeration() {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const data = await api('/admin/comments/reported');
        setComments(data.comments || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const act = async (id, fn) => {
    setBusy(id);
    setError('');
    try {
      await fn();
      setComments((prev) => prev.filter((c) => c._id !== id));
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy('');
    }
  };

  const remove = (id) => act(id, () => api(`/comments/${id}`, { method: 'DELETE' }));
  const dismiss = (id) => act(id, () => api(`/admin/comments/${id}/dismiss`, { method: 'POST' }));

  if (loading) return <div className="center muted">Loading reported comments…</div>;
  if (comments.length === 0) {
    return (
      <>
        {error && <div className="alert">{error}</div>}
        <div className="empty">
          <h3>Queue is clear</h3>
          <p>No reported comments awaiting review.</p>
        </div>
      </>
    );
  }

  return (
    <div className="table-wrap">
      {error && <div className="alert">{error}</div>}
      <table className="admin-table">
        <thead>
          <tr>
            <th>Comment</th>
            <th>Author</th>
            <th>Story</th>
            <th>Reports</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {comments.map((c) => (
            <tr key={c._id}>
              <td>
                {c.body}
                <div className="muted" style={{ fontSize: 12 }}>{fmt(c.createdAt)}</div>
              </td>
              <td>{c.authorName}</td>
              <td>
                {c.articleSlug ? <Link to={`/story/${c.articleSlug}`}>{c.articleTitle}</Link> : c.articleTitle}
              </td>
              <td>
                <span className="badge warn">{c.reportCount}</span>
                {c.reports?.some((r) => r.reason) && (
                  <ul className="report-reasons">
                    {c.reports.filter((r) => r.reason).map((r, i) => <li key={i}>{r.reason}</li>)}
                  </ul>
                )}
              </td>
              <td className="actions">
                <button className="danger" disabled={busy === c._id} onClick={() => remove(c._id)}>Delete</button>
                <button disabled={busy === c._id} onClick={() => dismiss(c._id)}>Dismiss</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
