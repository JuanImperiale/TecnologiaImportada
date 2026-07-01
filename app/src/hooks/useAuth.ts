import { useContext } from 'react';
import { AuthContext } from '@/providers/AuthProvider';

/** Acceso a la sesión actual y a login/logout. Debe usarse dentro de <AuthProvider>. */
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return ctx;
}
