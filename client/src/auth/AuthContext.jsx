import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { api } from '../api';

const AuthCtx = createContext(null);
export const useAuth = () => useContext(AuthCtx);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  // Guards against a slow/superseded refresh() (e.g. a cold-started backend)
  // resolving after a login/register and clobbering the fresher user state.
  const opId = useRef(0);

  const refresh = useCallback(async () => {
    const id = ++opId.current;
    try {
      const { user } = await api('/auth/me');
      if (opId.current === id) setUser(user);
    } catch {
      if (opId.current === id) setUser(null);
    } finally {
      // Same guard as above: a superseded refresh must not flip loading off
      // before the winning call has set the user (StrictMode double-mounts
      // otherwise bounce hard-loaded guarded routes to /login).
      if (opId.current === id) setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const login = async (email, password) => {
    const id = ++opId.current;
    const { user } = await api('/auth/login', { method: 'POST', body: { email, password } });
    if (opId.current === id) setUser(user);
    return user;
  };

  const register = async (name, email, password) => {
    const id = ++opId.current;
    const { user } = await api('/auth/register', {
      method: 'POST',
      body: { name, email, password },
    });
    if (opId.current === id) setUser(user);
    return user;
  };

  const logout = async () => {
    const id = ++opId.current;
    await api('/auth/logout', { method: 'POST' });
    if (opId.current === id) setUser(null);
  };

  const changePassword = async (currentPassword, newPassword) => {
    const id = ++opId.current;
    const { user } = await api('/auth/change-password', {
      method: 'POST',
      body: { currentPassword, newPassword },
    });
    if (opId.current === id) setUser(user);
    return user;
  };

  return (
    <AuthCtx.Provider value={{ user, loading, login, register, logout, refresh, changePassword }}>
      {children}
    </AuthCtx.Provider>
  );
}
