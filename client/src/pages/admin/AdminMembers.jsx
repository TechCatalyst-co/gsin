import { useEffect, useState } from 'react';
import { api } from '../../api';
import { useAuth } from '../../auth/AuthContext';

const fmtDate = (d) => new Date(d).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });

const statusBadge = (s) =>
  ['active', 'trialing'].includes(s) ? 'badge active' : ['past_due', 'unpaid'].includes(s) ? 'badge warn' : 'badge';

const ROLES = ['member', 'editor', 'admin'];
const roleLabel = { member: 'member', editor: 'editor (curates the feed, moderates)', admin: 'admin' };

function CreateUserForm({ busy, onCancel, onCreate }) {
  const [form, setForm] = useState({ name: '', email: '', role: 'member', premium: false });
  const set = (key) => (e) => setForm((prev) => ({ ...prev, [key]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));
  return (
    <form className="admin-panel admin-create" onSubmit={(e) => { e.preventDefault(); onCreate(form); }}>
      <h3>Create user</h3>
      <div className="admin-form-grid">
        <label>Name<input value={form.name} onChange={set('name')} /></label>
        <label>Email<input type="email" required value={form.email} onChange={set('email')} /></label>
        <label>Role<select value={form.role} onChange={set('role')}>{ROLES.map((r) => <option key={r}>{r}</option>)}</select></label>
        <label className="tier-toggle"><input type="checkbox" checked={form.premium} onChange={set('premium')} /> Grant Premium now</label>
      </div>
      <p className="muted">A temporary password will be generated and shown once.</p>
      <div className="actions"><button className="btn primary sm" disabled={busy}>{busy ? 'Creating…' : 'Create user'}</button><button type="button" className="btn ghost sm" disabled={busy} onClick={onCancel}>Cancel</button></div>
    </form>
  );
}

export default function AdminMembers() {
  const { user: me } = useAuth();
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState(''); // applied search
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [credential, setCredential] = useState(null);
  // Two-step confirm instead of window.confirm (unsupported in some
  // environments): { id, body, label } of the action awaiting confirmation.
  const [pending, setPending] = useState(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const data = await api(`/admin/users?page=${page}${query ? `&search=${encodeURIComponent(query)}` : ''}`);
        setUsers(data.users || []);
        setPagination(data.pagination);
        setError('');
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [page, query]);

  const patch = async (u, body) => {
    setBusy(u.id);
    setError('');
    try {
      const data = await api(`/admin/users/${u.id}`, { method: 'PATCH', body });
      setUsers((prev) => prev.map((x) => (x.id === u.id ? { ...x, ...data.user } : x)));
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy('');
      setPending(null);
    }
  };

  const createUser = async (body) => {
    setBusy('create'); setError('');
    try {
      const data = await api('/admin/users', { method: 'POST', body });
      setUsers((prev) => [data.user, ...prev]);
      setCredential({ email: data.user.email, password: data.temporaryPassword });
      setShowCreate(false);
    } catch (err) { setError(err.message); } finally { setBusy(''); }
  };

  const resetPassword = async (u) => {
    setBusy(u.id); setError('');
    try {
      const data = await api(`/admin/users/${u.id}/reset-password`, { method: 'POST' });
      setCredential({ email: u.email, password: data.temporaryPassword });
    } catch (err) { setError(err.message); } finally { setBusy(''); setPending(null); }
  };

  const updateSubscription = async (u, body) => {
    setBusy(u.id); setError('');
    try {
      const data = await api(`/admin/users/${u.id}/subscription`, { method: 'PATCH', body });
      setUsers((prev) => prev.map((x) => x.id === u.id ? { ...x, ...data.user } : x));
    } catch (err) { setError(err.message); } finally { setBusy(''); setPending(null); }
  };

  return (
    <>
      <div className="toolbar admin-members-bar">
        <label className="search">
          <svg className="admin-search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
            <circle cx="10.5" cy="10.5" r="6.5" />
            <path d="m16 16 4.5 4.5" />
          </svg>
          <input
            type="search"
            aria-label="Search members by email or name"
            placeholder="Search by email or name…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { setPage(1); setQuery(search.trim()); } }}
          />
        </label>
        <button className="btn ghost sm" onClick={() => { setPage(1); setQuery(search.trim()); }}>Search</button>
        <button className="btn primary sm" onClick={() => setShowCreate(true)}>Create user</button>
      </div>

      {error && <div className="alert">{error}</div>}
      {credential && (
        <div className="alert credential-box">
          <strong>Temporary password for {credential.email}</strong>
          <code>{credential.password}</code>
          <button className="btn ghost sm" onClick={() => navigator.clipboard?.writeText(credential.password)}>Copy</button>
          <button className="btn ghost sm" onClick={() => setCredential(null)}>Dismiss</button>
          <div>This password is shown only here. Send it securely; the user must replace it at sign-in.</div>
        </div>
      )}
      {showCreate && <CreateUserForm busy={busy === 'create'} onCancel={() => setShowCreate(false)} onCreate={createUser} />}
      {loading ? (
        <div className="center muted">Loading members…</div>
      ) : (
        <div className="admin-panel">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Member</th>
                <th>Subscription</th>
                <th>Role</th>
                <th>Joined</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const self = me?.id === u.id;
                return (
                  <tr key={u.id}>
                    <td>
                      {u.name || <span className="muted">(no name)</span>}
                      <div className="muted" style={{ fontSize: 12 }}>{u.email}</div>
                    </td>
                    <td>
                      <span className={statusBadge(u.subscriptionStatus)}>{u.subscriptionStatus}</span>
                      {u.subscriptionOverride !== 'none' && <span className="badge warn" style={{ marginLeft: 6 }}>manual {u.subscriptionOverride}</span>}
                      {u.billingSubscriptionStatus && u.billingSubscriptionStatus !== u.subscriptionStatus && <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>Stripe: {u.billingSubscriptionStatus}</div>}
                      {u.banned && <span className="badge warn" style={{ marginLeft: 6 }}>banned</span>}
                    </td>
                    <td>
                      <select
                        value={u.role}
                        disabled={self || busy === u.id}
                        onChange={(e) => {
                          const role = e.target.value;
                          if (role === u.role) return;
                          setPending({ id: u.id, body: { role }, label: `Change role to ${roleLabel[role]}?` });
                        }}
                      >
                        {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                      </select>
                    </td>
                    <td>{fmtDate(u.createdAt)}</td>
                    <td>
                      <div className="actions">
                        {pending?.id === u.id ? (
                          <>
                            <span className="muted confirm-message">{pending.label}</span>
                            {pending.kind === 'subscription-inactive' && <input placeholder="Reason required" maxLength={500} value={pending.reason || ''} onChange={(e) => setPending({ ...pending, reason: e.target.value })} />}
                            <button className="danger" disabled={busy === u.id || (pending.kind === 'subscription-inactive' && !pending.reason?.trim())} onClick={() => {
                              if (pending.kind === 'reset') return resetPassword(u);
                              if (pending.kind === 'subscription-active') return updateSubscription(u, { override: 'active', reason: 'Granted by administrator' });
                              if (pending.kind === 'subscription-inactive') return updateSubscription(u, { override: 'inactive', reason: pending.reason });
                              if (pending.kind === 'subscription-none') return updateSubscription(u, { override: 'none' });
                              return patch(u, pending.body);
                            }}>
                              Confirm
                            </button>
                            <button disabled={busy === u.id} onClick={() => setPending(null)}>Cancel</button>
                          </>
                        ) : (
                          <>
                            <button
                              className="danger"
                              disabled={self || busy === u.id}
                              onClick={() =>
                                setPending({
                                  id: u.id,
                                  body: { banned: !u.banned },
                                  label: u.banned
                                    ? 'Unban — they can post again.'
                                    : 'Ban blocks posting only; cancel their Stripe subscription separately if refusing service.',
                                })
                              }
                            >
                              {u.banned ? 'Unban' : 'Ban'}
                            </button>
                            {!self && <button onClick={() => setPending({ id: u.id, kind: 'reset', label: 'Reset password and sign out all existing sessions?' })}>Reset password</button>}
                            {!self && u.subscriptionOverride !== 'active' && <button onClick={() => setPending({ id: u.id, kind: 'subscription-active', label: 'Grant Premium without billing?' })}>Grant Premium</button>}
                            {!self && u.subscriptionOverride !== 'inactive' && <button className="danger" onClick={() => setPending({ id: u.id, kind: 'subscription-inactive', reason: '', label: 'Revoke Premium access?' })}>Revoke Premium</button>}
                            {u.subscriptionOverride !== 'none' && <button onClick={() => setPending({ id: u.id, kind: 'subscription-none', label: 'Return access control to Stripe?' })}>Use Stripe</button>}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {pagination && pagination.totalPages > 1 && (
            <div className="comment-form-foot" style={{ marginTop: 12 }}>
              <span className="muted">{pagination.total} members</span>
              <span className="actions" style={{ display: 'flex', gap: 12 }}>
                <button className="btn ghost sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</button>
                <span className="muted">Page {pagination.page} / {pagination.totalPages}</span>
                <button className="btn ghost sm" disabled={page >= pagination.totalPages} onClick={() => setPage((p) => p + 1)}>Next</button>
              </span>
            </div>
          )}
        </div>
      )}
    </>
  );
}
