import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../auth/AuthContext';
import { BRAND, CATEGORIES } from '../brand';
import { useDocumentTitle } from './Home';

const LABEL = {
  active: 'Active',
  trialing: 'Trial',
  past_due: 'Payment past due',
  canceled: 'Canceled',
  unpaid: 'Unpaid',
  inactive: 'Free account',
};

export default function Account() {
  const { user, refresh } = useAuth();
  const [params] = useSearchParams();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(params.get('checkout') === 'success' ? 'Payment received. Turning on Premium…' : '');
  const [topics, setTopics] = useState(user?.followedCategories || []);
  const [savedTopics, setSavedTopics] = useState('');
  useDocumentTitle(`Account — ${BRAND.name}`);

  useEffect(() => {
    if (params.get('checkout') === 'success') {
      const t = setTimeout(() => refresh().then(() => setMsg('Premium is on. Welcome aboard.')), 2500);
      return () => clearTimeout(t);
    }
  }, [params, refresh]);

  const manage = async () => {
    setBusy(true);
    try {
      const { url } = await api('/billing/portal', { method: 'POST' });
      window.location.href = url;
    } catch (err) {
      setMsg(err.message);
      setBusy(false);
    }
  };

  const toggleTopic = async (name) => {
    const next = topics.includes(name) ? topics.filter((t) => t !== name) : [...topics, name];
    setTopics(next);
    setSavedTopics('');
    try {
      await api('/me/categories', { method: 'PUT', body: { categories: next } });
      setSavedTopics('Saved');
    } catch (err) {
      setSavedTopics(err.message);
    }
  };

  if (!user) return null;

  return (
    <div className="shell narrow account">
      <h1>Account</h1>
      {msg && <div className="alert soft">{msg}</div>}

      <dl className="kv">
        <div><dt>Name</dt><dd>{user.name || 'Not set'}</dd></div>
        <div><dt>Email</dt><dd>{user.email}</dd></div>
        <div><dt>Membership</dt><dd>{user.isPremium ? (user.role === 'member' ? `Premium (${LABEL[user.subscriptionStatus] || user.subscriptionStatus})` : `Staff (${user.role})`) : LABEL[user.subscriptionStatus] || 'Free account'}</dd></div>
        {user.currentPeriodEnd && user.hasAccess && <div><dt>Renews</dt><dd>{new Date(user.currentPeriodEnd).toLocaleDateString()}</dd></div>}
      </dl>

      <div className="actions-row">
        {user.hasAccess || user.billingSubscriptionStatus !== 'inactive' ? (
          <button className="btn ghost" onClick={manage} disabled={busy}>{busy ? 'Opening…' : 'Manage billing'}</button>
        ) : null}
        {!user.isPremium && <Link to="/premium" className="btn primary">Go Premium for {BRAND.premiumPrice}/mo</Link>}
        <Link to="/change-password" className="btn ghost">Change password</Link>
      </div>

      <section className="topics-pref" aria-labelledby="topics-h">
        <h2 id="topics-h" className="section-h">Topics you follow</h2>
        <p className="muted">Stories from these topics appear under Saved, and in the app’s For You tab.</p>
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
        {savedTopics && <p className="muted small" role="status">{savedTopics}</p>}
      </section>

      <p className="muted small"><Link to="/delete-account">Request account deletion</Link></p>
    </div>
  );
}
