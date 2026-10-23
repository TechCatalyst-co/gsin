import { useState } from 'react';
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { safeInternalPath } from '../url';
import PasswordInput from '../components/PasswordInput';

export default function Login() {
  const { login } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  const [params] = useSearchParams();
  // ?returnTo= is honored only if it is a safe internal path (no open redirects).
  const returnTo = safeInternalPath(params.get('returnTo'));
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const user = await login(form.email, form.password);
      const dest = user.mustChangePassword ? '/change-password' : (returnTo || loc.state?.from || '/news');
      nav(dest);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <h2>Sign in</h2>
        {error && <div className="alert">{error}</div>}
        <form onSubmit={submit}>
          <label>Email<input type="email" required value={form.email} onChange={set('email')} /></label>
          <label>Password<PasswordInput required value={form.password} onChange={set('password')} /></label>
          <button className="btn primary full" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
        </form>
        <p className="switch">New here? <Link to="/register">Create an account</Link></p>
      </div>
    </div>
  );
}
