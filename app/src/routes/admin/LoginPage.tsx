import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { loginSchema, type LoginForm } from '@/schemas';
import { useAuth } from '@/hooks/useAuth';
import { usePageMeta } from '@/hooks/usePageMeta';
import { Card, CardBody } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

/** Login del panel admin. Puerta de entrada en /adm. */
export function LoginPage() {
  const navigate = useNavigate();
  const { isAuthenticated, loading, login } = useAuth();

  usePageMeta({ robots: 'noindex,nofollow', title: 'Login admin | Tecnologia Importada' });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) });

  // Si ya hay sesión, ir directo al panel
  useEffect(() => {
    if (!loading && isAuthenticated) navigate('/adm/dashboard', { replace: true });
  }, [loading, isAuthenticated, navigate]);

  const onSubmit = handleSubmit(async ({ email, password }) => {
    const res = await login(email, password);
    if (!res.ok) {
      toast.error(res.error.message);
      return;
    }
    toast.success('¡Bienvenido!');
    navigate('/adm/dashboard', { replace: true });
  });

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 p-4">
      <img
        src="/TIPrincipal.png"
        alt="Tecnología Importada"
        className="h-28 w-auto object-contain"
      />
      <Card className="w-full max-w-sm">
        <CardBody className="flex flex-col gap-4">
          <div>
            <h1 className="text-xl font-bold tracking-tight">Panel de administración</h1>
            <p className="text-sm text-text-soft">Ingresá con tu cuenta del equipo.</p>
          </div>
          <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
            <Input
              label="Email"
              type="email"
              autoComplete="email"
              placeholder="vos@negocio.com"
              error={errors.email?.message}
              {...register('email')}
            />
            <Input
              label="Contraseña"
              type="password"
              autoComplete="current-password"
              placeholder="••••••"
              error={errors.password?.message}
              {...register('password')}
            />
            <Button type="submit" loading={isSubmitting} className="w-full">
              Ingresar
            </Button>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}
