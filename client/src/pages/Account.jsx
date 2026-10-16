import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../auth/AuthContext';
import { BRAND, CATEGORIES } from '../brand';
import { useDocumentTitle } from './Home';

export default function Account() {
  const { user, refresh } = useAuth();
  const [topics, setTopics] = useState(user?.followedCategories || []);
  const [status, setStatus] = useState('');
  useDocumentTitle(`Account — ${BRAND.short}`);

  const save = async (path, body) => {
    setStatus('');
    try {
      await api(path, { method: 'PUT', body });
      setStatus('Saved');
      refresh();
    } catch (err) {
      setStatus(err.message);
    }
  };

  const toggleTopic = (name) => {
    const next = topics.includes(name) ? topics.filter((t) => t !== name) : [...topics, name];
    setTopics(next);
    save('/me/categories', { categories: next });
  };

  if (!user) return null;

  return (
    <div className="shell narrow account">
      <h1>Account</h1>

      <dl className="kv">
        <div><dt>Name</dt><dd>{user.name || 'Not set'}</dd></div>
        <div><dt>Email</dt><dd>{user.email}</dd></div>
        {user.role !== 'member' && <div><dt>Role</dt><dd>{user.role === 'admin' ? 'Admin' : 'Editor'}</dd></div>}
      </dl>

      <section className="topics-pref" aria-labelledby="email-h">
        <h2 id="email-h" className="section-h">Email</h2>
        <label className="check">
          <input
            type="checkbox"
            checked={user.briefEmails !== false}
            onChange={(e) => save('/me/preferences', { briefEmails: e.target.checked })}
          />
          Send me the Daily Brief each morning
        </label>
      </section>

      <section className="topics-pref" aria-labelledby="topics-h">
        <h2 id="topics-h" className="section-h">Topics you follow</h2>
        <p className="muted">Stories from these topics appear under Saved, and in the app’s For you tab.</p>
        <div className="topic-toggles">
          {CATEGORIES.map((c) => {
            const on = topics.includes(c.name);
            return (
              <button key={c.slug} className={`topic-toggle${on ? ' is-on' : ''}`} aria-pressed={on} onClick={() => toggleTopic(c.name)}>
                <span className="cat-dot" style={{ background: c.hue }} aria-hidden="true" />{c.name}
              </button>
            );
          })}
        </div>
      </section>
      {status && <p className="muted small" role="status">{status}</p>}

      <div className="actions-row">
        <Link to="/change-password" className="btn ghost">Change password</Link>
      </div>
      <p className="muted small"><Link to="/delete-account">Request account deletion</Link></p>
    </div>
  );
}
