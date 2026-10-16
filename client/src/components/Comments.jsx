import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../auth/AuthContext';

const MAX_DEPTH = 6; // deeper replies render flat so threads never run out of width

const fmtWhen = (d) => {
  const t = new Date(d);
  if (isNaN(t)) return '';
  const mins = Math.round((Date.now() - t) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  if (mins < 60 * 24) return `${Math.round(mins / 60)}h ago`;
  return t.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

function buildTree(flat) {
  const byId = new Map(flat.map((c) => [c._id, { ...c, children: [] }]));
  const roots = [];
  byId.forEach((c) => {
    const parent = c.parent && byId.get(c.parent);
    // Orphans (parent outside the fetch cap) surface at the root.
    if (parent) parent.children.push(c);
    else roots.push(c);
  });
  return roots;
}

const BADGE = { staff: 'Editor', premium: 'Premium' };

// Discussion under a story. Readable by everyone; posting is Premium.
export default function CommentsPanel({ newsItemId, onCountChange }) {
  const { user } = useAuth();
  const [comments, setComments] = useState([]);
  const [canPost, setCanPost] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    try {
      const data = await api(`/comments?newsItem=${newsItemId}`);
      setComments(data.comments || []);
      setCanPost(!!data.canPost);
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [newsItemId]); // eslint-disable-line react-hooks/exhaustive-deps

  const tree = useMemo(() => buildTree(comments), [comments]);

  const post = async (body, parent) => {
    const data = await api('/comments', { method: 'POST', body: { newsItem: newsItemId, body, parent } });
    setComments((prev) => [...prev, data.comment]);
    onCountChange?.(+1);
  };

  const remove = async (id) => {
    await api(`/comments/${id}`, { method: 'DELETE' });
    setComments((prev) =>
      prev.map((c) => (c._id === id ? { ...c, status: 'removed', body: null, authorName: null } : c))
    );
    onCountChange?.(-1);
  };

  const report = async (id, reason) => {
    await api(`/comments/${id}/report`, { method: 'POST', body: { reason } });
    setComments((prev) => prev.map((c) => (c._id === id ? { ...c, reportedByMe: true } : c)));
  };

  const block = async (authorId) => {
    await api('/comments/block', { method: 'POST', body: { userId: authorId } });
    await load(); // redaction comes from the server
  };

  if (loading) return <div className="comments"><span className="muted">Loading discussion…</span></div>;

  return (
    <div className="comments">
      {error && <div className="alert">{error}</div>}
      {canPost ? (
        <CommentForm placeholder="Add to the discussion" onSubmit={(body) => post(body, null)} />
      ) : (
        <div className="comment-gate">
          {user
            ? <>Premium members can post. <Link to="/premium">See Premium</Link></>
            : <><Link to="/login">Sign in</Link> to join the discussion. Posting is part of <Link to="/premium">Premium</Link>.</>}
        </div>
      )}
      {tree.length === 0 && <p className="muted">No comments yet.</p>}
      {tree.map((c) => (
        <CommentNode key={c._id} c={c} depth={0} user={user} canPost={canPost} onPost={post} onRemove={remove} onReport={report} onBlock={block} />
      ))}
    </div>
  );
}

function CommentNode({ c, depth, user, canPost, onPost, onRemove, onReport, onBlock }) {
  // One expandable panel at a time under the comment: reply form, report
  // form, or block confirmation. No window.prompt/confirm — not every
  // environment supports them.
  const [panel, setPanel] = useState(null); // 'reply' | 'report' | 'block' | null
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const removed = c.status === 'removed';
  const redacted = removed || c.hidden;
  const canDelete = !removed && (c.isMine || user?.capabilities?.curate);
  const badge = redacted ? null : BADGE[c.authorBadge];

  const toggle = (name) => {
    setError('');
    setPanel((p) => (p === name ? null : name));
  };

  const act = (fn) => async () => {
    setBusy(true);
    setError('');
    try {
      await fn();
      setPanel(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={`comment${c.authorBadge === 'staff' && !redacted ? ' comment--staff' : ''}`}>
      <div className="comment-meta">
        <strong>{removed ? 'Removed' : c.hidden ? 'Hidden (blocked user)' : c.authorName}</strong>
        {badge && <span className={`badge badge--${c.authorBadge}`}>{badge}</span>}
        <span>{fmtWhen(c.createdAt)}</span>
      </div>
      {!redacted && <p className="comment-body">{c.body}</p>}
      <div className="comment-actions">
        {!redacted && canPost && <button disabled={busy} onClick={() => toggle('reply')}>{panel === 'reply' ? 'Cancel' : 'Reply'}</button>}
        {!redacted && user && !c.isMine && (
          c.reportedByMe
            ? <span className="muted">Reported</span>
            : <button disabled={busy} onClick={() => toggle('report')}>{panel === 'report' ? 'Cancel' : 'Report'}</button>
        )}
        {!redacted && user && !c.isMine && c.authorId && (
          <button disabled={busy} onClick={() => toggle('block')}>{panel === 'block' ? 'Cancel' : 'Block user'}</button>
        )}
        {canDelete && <button disabled={busy} className="danger" onClick={act(() => onRemove(c._id))}>Delete</button>}
      </div>
      {error && <div className="alert">{error}</div>}
      {panel === 'reply' && (
        <CommentForm
          autoFocus
          placeholder={`Reply to ${c.authorName || 'comment'}`}
          onSubmit={async (body) => { await onPost(body, c._id); setPanel(null); }}
        />
      )}
      {panel === 'report' && (
        <div className="comment-inline-panel">
          <input
            autoFocus
            value={reason}
            maxLength={500}
            placeholder="Reason (optional)"
            onChange={(e) => setReason(e.target.value)}
          />
          <button className="btn primary sm" disabled={busy} onClick={act(() => onReport(c._id, reason.trim()))}>
            Report
          </button>
        </div>
      )}
      {panel === 'block' && (
        <div className="comment-inline-panel">
          <span className="muted">Hide all comments from {c.authorName || 'this member'}?</span>
          <button className="btn primary sm" disabled={busy} onClick={act(() => onBlock(c.authorId))}>
            Block
          </button>
        </div>
      )}
      {c.children.length > 0 && (
        <div className={depth < MAX_DEPTH ? 'comment-children' : 'comment-children flat'}>
          {c.children.map((ch) => (
            <CommentNode key={ch._id} c={ch} depth={depth + 1} user={user} canPost={canPost} onPost={onPost} onRemove={onRemove} onReport={onReport} onBlock={onBlock} />
          ))}
        </div>
      )}
    </div>
  );
}

function CommentForm({ onSubmit, placeholder, autoFocus }) {
  const [body, setBody] = useState('');
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    if (!body.trim() || posting) return;
    setPosting(true);
    setError('');
    try {
      await onSubmit(body.trim());
      setBody('');
    } catch (err) {
      setError(err.message);
    } finally {
      setPosting(false);
    }
  };

  return (
    <form className="comment-form" onSubmit={submit}>
      {error && <div className="alert">{error}</div>}
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder={placeholder}
        maxLength={2000}
        rows={3}
        autoFocus={autoFocus}
      />
      <div className="comment-form-foot">
        <span className="muted">{body.length}/2000</span>
        <button className="btn primary" type="submit" disabled={posting || !body.trim()}>
          {posting ? 'Posting…' : 'Post'}
        </button>
      </div>
    </form>
  );
}
