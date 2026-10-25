import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { getMe, logout as apiLogout } from '../lib/api';

const defaultAuthValue = {
  user: null,
  setUser: () => {},
  checking: true,
  refresh: async () => {},
  logout: async () => {},
};

const AuthContext = createContext(defaultAuthValue);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const data = await getMe();
      setUser(data.user?.name ? data.user : null);
    } catch {
      setUser(null);
    } finally {
      setChecking(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const logout = useCallback(async () => {
    try { await apiLogout(); } catch { /* cookie may already be gone */ }
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, setUser, checking, refresh, logout }),
    [user, checking, refresh, logout]
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
