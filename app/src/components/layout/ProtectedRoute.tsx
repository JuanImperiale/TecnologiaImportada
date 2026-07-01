import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Spinner } from '@/components/ui/Spinner';

/**
 * Guard de rutas admin. No hay roles: basta con estar autenticado.
 * - Cargando sesión → spinner.
 * - Sin sesión → manda al login (/adm).
 */
export function ProtectedRoute() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to="/adm" replace />;

  return <Outlet />;
}
