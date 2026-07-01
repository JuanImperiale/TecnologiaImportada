import { ShieldX } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';

/** Pantalla para usuarios autenticados sin el rol necesario. */
export function SinPermiso() {
  const { logout, user } = useAuth();
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
      <ShieldX size={40} className="text-danger" aria-hidden="true" />
      <h1 className="text-xl font-bold tracking-tight">Sin permisos</h1>
      <p className="max-w-md text-text-soft">
        {user?.email
          ? `La cuenta ${user.email} no tiene permisos para el panel.`
          : 'Tu cuenta no tiene permisos para el panel.'}{' '}
        Pedí que te asignen un rol (admin o staff).
      </p>
      <Button variant="ghost" onClick={() => void logout()}>
        Cerrar sesión
      </Button>
    </div>
  );
}
