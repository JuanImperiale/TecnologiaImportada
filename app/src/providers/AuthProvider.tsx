import { createContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { authService, type SessionUser } from '@/services/authService';
import type { Result } from '@/services/result';

interface AuthContextValue {
  user: SessionUser | null;
  loading: boolean;
  /** true si hay un usuario autenticado (= acceso al panel; no hay roles). */
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<Result<void>>;
  logout: () => Promise<Result<void>>;
}

// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = authService.observe((u) => {
      setUser(u);
      setLoading(false);
    });
    return unsub;
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      isAuthenticated: !!user,
      login: authService.login,
      logout: authService.logout,
    }),
    [user, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
