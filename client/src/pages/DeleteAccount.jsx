import { useState } from 'react';
import { BRAND } from '../brand';
import { api } from '../api';

export default function DeleteAccount() {
  const [form, setForm] = useState({ email: '', reason: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const set = (key) => (e) => setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await api('/account/deletion-request', {
        method: 'POST',
        body: { email: form.email, reason: form.reason },
      });
      setDone(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <h2>Delete your account</h2>
        {done ? (
          <>
            <p className="muted">
              We've received your request. We'll email you at{' '}
              <strong>{form.email}</strong> to verify your identity and complete the deletion
              of your account and associated data.
            </p>
            <p className="muted">
              Questions? Contact{' '}
              <a href={`mailto:${BRAND.supportEmail}`}>{BRAND.supportEmail}</a>.
            </p>
          </>
        ) : (
          <>
            <p className="muted">
              Request permanent deletion of your {BRAND.name} account and the data associated with
              it. Requests are reviewed manually — we'll email you to confirm before anything is
              deleted.
            </p>
            {error && <div className="alert">{error}</div>}
            <form onSubmit={submit}>
              <label>
                Account email
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={set('email')}
                  placeholder="you@example.com"
                />
              </label>
              <label>
                Reason (optional)
                <textarea
                  rows={4}
                  value={form.reason}
                  onChange={set('reason')}
                  placeholder="Anything you'd like us to know"
                />
              </label>
              <button className="btn primary full" disabled={busy}>
                {busy ? 'Submitting…' : 'Request account deletion'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
