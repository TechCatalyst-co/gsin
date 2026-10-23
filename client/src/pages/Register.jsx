import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import PasswordInput from '../components/PasswordInput';

export default function Register() {
  const { register } = useAuth();
  const nav = useNavigate();
  const [params] = useSearchParams();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await register(form.name, form.email, form.password);
      nav('/news');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <h2>Create your free account</h2>
        <p className="muted">Join discussions, save stories, follow topics, and get the Daily Brief by email. Free.</p>
        {error && <div className="alert">{error}</div>}
        <form onSubmit={submit}>
          <label>Name<input value={form.name} onChange={set('name')} placeholder="Jane Doe" /></label>
          <label>Email<input type="email" required value={form.email} onChange={set('email')} placeholder="you@example.com" /></label>
          <label>Password<PasswordInput required minLength={8} value={form.password} onChange={set('password')} placeholder="At least 8 characters" /></label>
          <button className="btn primary full" disabled={busy}>{busy ? 'Creating account…' : 'Create account'}</button>
        </form>
        <p className="switch">Already a member? <Link to="/login">Sign in</Link></p>
      </div>
    </div>
  );
}
