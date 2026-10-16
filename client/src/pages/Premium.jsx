import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../auth/AuthContext';
import { BRAND } from '../brand';
import { useDocumentTitle } from './Home';

const FREE = ['Every story on the wire', 'Topic pages, search and RSS', 'Read every discussion', 'Save stories and follow topics'];
const PREMIUM = ['The Daily Brief, every morning', 'Extended analysis on major stories', 'Post and reply in discussions', 'Brief archive', 'Support independent AI coverage'];

export default function Premium() {
  const { user } = useAuth();
  const nav = useNavigate();
  const [params] = useSearchParams();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  useDocumentTitle(`Premium — ${BRAND.name}`);

  const subscribe = async () => {
    if (!user) return nav('/register?next=premium');
    setError('');
    setBusy(true);
    try {
      const { url } = await api('/billing/checkout', { method: 'POST', body: { tier: 'premium' } });
      window.location.href = url;
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <div className="shell narrow">
      <header className="pitch">
        <h1>Premium</h1>
        <p className="pitch-lede">Reading {BRAND.name} is free. Premium is for people who follow AI closely and want the morning brief, the deeper analysis, and a seat in the discussion.</p>
      </header>
      {params.get('checkout') === 'cancelled' && <div className="alert soft">Checkout cancelled. You weren’t charged.</div>}
      {error && <div className="alert">{error}</div>}

      <div className="plans">
        <section className="plan">
          <h2>Free</h2>
          <p className="plan-price">$0</p>
          <ul>{FREE.map((f) => <li key={f}>{f}</li>)}</ul>
          {!user && <Link to="/register" className="btn ghost full">Create a free account</Link>}
        </section>
        <section className="plan plan--premium">
          <h2>Premium</h2>
          <p className="plan-price">{BRAND.premiumPrice}<span>/month</span></p>
          <ul>{PREMIUM.map((f) => <li key={f}>{f}</li>)}</ul>
          {user?.isPremium ? (
            <Link to="/brief" className="btn primary full">You’re Premium. Open the brief</Link>
          ) : (
            <button className="btn primary full" onClick={subscribe} disabled={busy}>
              {busy ? 'Opening secure checkout…' : user ? 'Subscribe' : 'Create account and subscribe'}
            </button>
          )}
        </section>
      </div>
      <p className="muted small">Payments are handled by Stripe. Cancel anytime from your account.</p>
    </div>
  );
}
