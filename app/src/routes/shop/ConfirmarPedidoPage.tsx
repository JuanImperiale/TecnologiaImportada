import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { ArrowLeft } from 'lucide-react';
import { confirmarPedidoSchema, type ConfirmarPedidoForm } from '@/schemas';
import { useCart } from '@/hooks/useCart';
import { orderService } from '@/services/orderService';
import { settingsService } from '@/services/settingsService';
import { Card, CardBody } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatMoney, formatUsd } from '@/lib/utils';

export function ConfirmarPedidoPage() {
  const navigate = useNavigate();
  const { items, totals, clear } = useCart();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ConfirmarPedidoForm>({
    resolver: zodResolver(confirmarPedidoSchema),
    defaultValues: { caracteristica: '2657' },
  });

  const caracteristica = watch('caracteristica') ?? '';
  const numero = watch('numero') ?? '';

  // Si no hay items (carrito vacío o ya enviado), volver al carrito
  useEffect(() => {
    if (items.length === 0) navigate('/carrito', { replace: true });
  }, [items.length, navigate]);

  const onSubmit = handleSubmit(async ({ nombre, caracteristica, numero }) => {
    const celular = `+54 9 ${caracteristica} ${numero}`;
    // Reservamos una ventana en el gesto del usuario para evitar bloqueos de popup
    // en iOS/in-app browsers cuando luego hay awaits (Firestore + settings).
    const reservedWindow = window.open('', '_blank');

    const res = await orderService.crearPedido({ nombre, celular, items, totals });
    if (!res.ok) {
      reservedWindow?.close();
      toast.error(res.error.message);
      return;
    }

    // Abrir WhatsApp con el detalle (si hay número configurado)
    const phone = await settingsService.getWhatsapp();
    let manualOpenUrl: string | undefined;

    if (phone) {
      const url = orderService.buildWhatsappUrl(phone, nombre, items, totals);

      if (reservedWindow && !reservedWindow.closed) {
        try {
          reservedWindow.location.href = url;
        } catch {
          manualOpenUrl = url;
          toast.message('No se pudo abrir WhatsApp automáticamente. Tocá el botón para abrirlo.');
        }
      } else {
        // Algunos navegadores embebidos bloquean popups aun con gesto del usuario.
        // Conservamos la pestaña de la app y mostramos una acción manual en la siguiente pantalla.
        manualOpenUrl = url;
        toast.message('Tu navegador bloqueó la pestaña nueva. Te dejamos un botón para abrir WhatsApp.');
      }
    } else {
      reservedWindow?.close();
      toast.message('Pedido registrado. (Falta configurar el WhatsApp del negocio.)');
    }

    clear();
    navigate('/pedido/enviado', { replace: true, state: { whatsappUrl: manualOpenUrl } });
  });

  if (items.length === 0) return <EmptyState title="Carrito vacío" />;

  return (
    <div className="mx-auto max-w-lg">
      <Link to="/carrito" className="mb-4 inline-flex items-center gap-1.5 text-sm text-text-soft hover:text-text">
        <ArrowLeft size={16} aria-hidden="true" /> Volver al carrito
      </Link>
      <h1 className="mb-2 text-2xl font-bold tracking-tight">Confirmar pedido</h1>
      <p className="mb-5 text-text-soft">
        Dejanos tu nombre y celular. Te contactamos por WhatsApp para coordinar el pago y el envío.
        No hace falta crear cuenta.
      </p>

      <Card>
        <CardBody className="flex flex-col gap-4">
          <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
            <Input label="Nombre" placeholder="Tu nombre" error={errors.nombre?.message} {...register('nombre')} />
            <div className="flex flex-col gap-1.5">
              <p className="text-sm font-medium text-text">Celular (WhatsApp)</p>
              <div className="flex items-start gap-2">
                <div className="w-28 flex-none">
                  <Input
                    label="Característica"
                    placeholder="2657"
                    inputMode="numeric"
                    maxLength={5}
                    error={errors.caracteristica?.message}
                    {...register('caracteristica')}
                  />
                </div>
                <div className="flex-1">
                  <Input
                    label="Número"
                    placeholder="123456"
                    inputMode="numeric"
                    maxLength={6}
                    error={errors.numero?.message}
                    {...register('numero')}
                  />
                </div>
              </div>
              {(caracteristica || numero) && (
                <p className="text-xs text-text-soft">
                  Número completo:{' '}
                  <span className="font-medium text-text">
                    +54 9 {caracteristica || '____'} {numero || '______'}
                  </span>
                </p>
              )}
            </div>
            <div className="flex flex-col gap-1 border-t border-line pt-3 text-text-soft">
              {totals.usd > 0 && (
                <div className="flex items-center justify-between">
                  <span>Total en dólares</span>
                  <span className="font-bold text-text">{formatUsd(totals.usd)}</span>
                </div>
              )}
              {totals.ars > 0 && (
                <div className="flex items-center justify-between">
                  <span>Total en pesos</span>
                  <span className="font-bold text-text">{formatMoney(totals.ars)}</span>
                </div>
              )}
            </div>
            <Button type="submit" loading={isSubmitting} className="w-full">
              Enviar pedido por WhatsApp
            </Button>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}
