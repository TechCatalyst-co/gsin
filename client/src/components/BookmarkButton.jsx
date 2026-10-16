import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../auth/AuthContext';

export default function BookmarkButton({ id, initial = false }) {
  const { user } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  const [saved, setSaved] = useState(initial);
  const [busy, setBusy] = useState(false);

  const toggle = async () => {
    if (!user) return nav('/login', { state: { from: loc.pathname } });
    setBusy(true);
    try {
      await api('/me/bookmarks', { method: 'POST', body: { newsItem: id, saved: !saved } });
      setSaved(!saved);
    } finally {
      setBusy(false);
    }
  };

  return (
    <button type="button" className={`btn ghost sm${saved ? ' is-on' : ''}`} aria-pressed={saved} disabled={busy} onClick={toggle}>
      {saved ? 'Saved' : 'Save'}
    </button>
  );
}
