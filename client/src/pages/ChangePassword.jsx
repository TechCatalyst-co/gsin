import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import PasswordInput from '../components/PasswordInput';

export default function ChangePassword() {
  const { changePassword } = useAuth();
  const nav = useNavigate();
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (key) => (e) => setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    if (form.newPassword !== form.confirm) return setError('New passwords do not match');
    setBusy(true);
    setError('');
    try {
      await changePassword(form.currentPassword, form.newPassword);
      nav('/news', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <h2>Choose a new password</h2>
        <p className="muted">Your temporary password must be replaced before you continue.</p>
        {error && <div className="alert">{error}</div>}
        <form onSubmit={submit}>
          <label>Temporary password<PasswordInput required value={form.currentPassword} onChange={set('currentPassword')} /></label>
          <label>New password<PasswordInput required minLength={8} value={form.newPassword} onChange={set('newPassword')} /></label>
          <label>Confirm new password<PasswordInput required minLength={8} value={form.confirm} onChange={set('confirm')} /></label>
          <button className="btn primary full" disabled={busy}>{busy ? 'Saving…' : 'Set new password'}</button>
        </form>
      </div>
    </div>
  );
}
