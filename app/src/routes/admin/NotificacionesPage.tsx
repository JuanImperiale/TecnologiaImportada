import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { MessageCircle, Check, X, RotateCcw, Clock, Receipt, Trash2 } from 'lucide-react';
import { usePedidos } from '@/hooks/usePedidos';
import { pedidoService } from '@/services/pedidoService';
import { contactoAdminService } from '@/services/contactoAdminService';
import { Card, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { ConfirmDialog } from '@/components/ui/Modal';
import { cn, formatPrice, formatMoney, formatUsd, formatDate, toDate } from '@/lib/utils';
import type { EstadoPedido, Pedido } from '@/models';

type Filtro = 'pendientes' | 'atendidos' | 'todos';

const estadoBadge: Record<EstadoPedido, { label: string; tone: 'info' | 'warning' | 'success' | 'neutral' }> = {
  nuevo: { label: 'Nuevo', tone: 'info' },
  visto: { label: 'Visto', tone: 'warning' },
  atendido: { label: 'Atendido', tone: 'success' },
  descartado: { label: 'Descartado', tone: 'neutral' },
};

function fecha(p: Pedido): string {
  const d = (p.creado as unknown as { toDate?: () => Date })?.toDate?.() ?? new Date();
  return formatDate(d, 'DD/MM/YYYY HH:mm');
}

export function NotificacionesPage() {
  const navigate = useNavigate();
  const { pedidos, loading, error } = usePedidos();
  const [filtro, setFiltro] = useState<Filtro>('pendientes');
  const [dia, setDia] = useState('');
  const [customNames, setCustomNames] = useState<Map<string, string>>(new Map());
  const [toDelete, setToDelete] = useState<Pedido | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const cargarEdiciones = async () => {
      const res = await contactoAdminService.getAllEdiciones();
      if (!res.ok) return;

      const nombres = new Map<string, string>();
      res.data.forEach((edicion, celular) => {
        if (!edicion.eliminado && edicion.nombre?.trim()) {
          nombres.set(celular, edicion.nombre.trim());
        }
      });
      setCustomNames(nombres);
    };

    void cargarEdiciones();
  }, []);

  const canonicalByPhone = useMemo(() => {
    const map = new Map<string, string>();
    const ordenados = [...pedidos].sort((a, b) => toDate(a.creado).getTime() - toDate(b.creado).getTime());

    // Base: primer nombre histórico visto por teléfono
    ordenados.forEach((p) => {
      const key = (p.contactoId ?? p.celular ?? '').replace(/\D/g, '');
      if (!key || map.has(key)) return;
      if (p.nombre?.trim()) map.set(key, p.nombre.trim());
    });

    // Prioridad: nombre editado manualmente por admin
    customNames.forEach((nombre, key) => {
      if (nombre?.trim()) map.set(key, nombre.trim());
    });

    return map;
  }, [pedidos, customNames]);

  const lista = useMemo(() => {
    const byFiltro = (() => {
      if (filtro === 'pendientes') {
        return pedidos.filter((p) => p.estado !== 'atendido' && p.estado !== 'descartado');
      }
      if (filtro === 'atendidos') return pedidos.filter((p) => p.estado === 'atendido');
      return pedidos;
    })();

    if (!dia) return byFiltro;

    return byFiltro.filter((p) => formatDate(toDate(p.creado), 'YYYY-MM-DD') === dia);
  }, [pedidos, filtro, dia]);

  const nombreMostrado = (p: Pedido): string => {
    const key = (p.contactoId ?? p.celular ?? '').replace(/\D/g, '');
    return canonicalByPhone.get(key) ?? p.nombre;
  };

  const listaConNombre = useMemo(
    () => lista.map((p) => ({ ...p, nombreMostrado: nombreMostrado(p) })),
    [lista, canonicalByPhone],
  );

  const responderWhatsapp = (p: Pedido) => {
    const phone = (p.celular ?? '').replace(/\D/g, '');
    if (!phone) {
      toast.error('Este pedido no tiene un celular válido.');
      return;
    }
    const texto = `Hola ${nombreMostrado(p)}! Te escribimos de Tecnología Importada por tu consulta. `;
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(texto)}`, '_blank');
    if (p.estado === 'nuevo') void pedidoService.setEstado(p.id, 'visto');
  };

  const cambiarEstado = async (p: Pedido, estado: EstadoPedido) => {
    const res = await pedidoService.setEstado(p.id, estado);
    if (!res.ok) toast.error(res.error.message);
    else toast.success('Actualizado.');
  };

  const eliminarPedido = async () => {
    if (!toDelete) return;
    setDeleting(true);
    const res = await pedidoService.remove(toDelete.id);
    setDeleting(false);

    if (res.ok) {
      setToDelete(null);
      toast.success('Pedido eliminado.');
    } else {
      toast.error(res.error.message);
    }
  };

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-4 text-2xl font-bold tracking-tight">Notificaciones</h1>

      <div className="mb-5 flex gap-2">
        {(['pendientes', 'atendidos', 'todos'] as Filtro[]).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFiltro(f)}
            className={cn(
              'rounded-pill border px-4 py-1.5 text-sm font-medium capitalize transition-colors',
              filtro === f
                ? 'border-transparent bg-accent text-on-accent'
                : 'border-line bg-surface-2 text-text-soft hover:text-text',
            )}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="mb-5 max-w-xs">
        <input
          type="date"
          value={dia}
          onChange={(e) => setDia(e.target.value)}
          className="h-11 w-full rounded-pill border border-line bg-surface-2 px-4 text-sm text-text"
          aria-label="Filtrar pedidos por día"
        />
      </div>

      {loading ? (
        <Spinner />
      ) : error ? (
        <EmptyState title="Error" description={error} />
      ) : listaConNombre.length === 0 ? (
        <EmptyState
          icon={<Clock size={36} />}
          title="Sin consultas"
          description="Acá van a aparecer las consultas que envíen los clientes desde el carrito."
        />
      ) : (
        <div className="flex flex-col gap-3">
          {listaConNombre.map((p) => {
            const eb = estadoBadge[p.estado];
            return (
              <Card key={p.id}>
                <CardBody className="flex flex-col gap-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-bold">{p.nombreMostrado}</p>
                      <p className="text-sm text-text-soft">{p.celular} · {fecha(p)}</p>
                    </div>
                    <Badge tone={eb.tone}>{eb.label}</Badge>
                  </div>

                  <div className="rounded-md bg-surface-2 p-3 text-sm">
                    {p.items.map((i, idx) => (
                      <div key={idx} className="flex justify-between gap-3 py-0.5">
                        <span className="min-w-0 truncate">
                          {i.cantidad}× {i.nombre}
                        </span>
                        <span className="shrink-0 text-text-soft">
                          {formatPrice(i.precioMostrado ?? i.precioUnitario, i.monedaVenta ?? 'ARS')}
                        </span>
                      </div>
                    ))}
                    <div className="mt-2 flex flex-wrap justify-end gap-x-4 border-t border-line pt-2 font-bold">
                      {p.totalUsd > 0 && <span>Total USD: {formatUsd(p.totalUsd)}</span>}
                      {p.totalArs > 0 && <span>Total ARS: {formatMoney(p.totalArs)}</span>}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" onClick={() => responderWhatsapp(p)}>
                      <MessageCircle size={15} aria-hidden="true" /> Responder por WhatsApp
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => navigate('/adm/ventas/nueva', { state: { pedido: p } })}
                    >
                      <Receipt size={15} aria-hidden="true" /> Convertir en venta
                    </Button>
                    {p.estado !== 'atendido' ? (
                      <Button size="sm" variant="ghost" onClick={() => cambiarEstado(p, 'atendido')}>
                        <Check size={15} aria-hidden="true" /> Marcar atendido
                      </Button>
                    ) : (
                      <Button size="sm" variant="ghost" onClick={() => cambiarEstado(p, 'visto')}>
                        <RotateCcw size={15} aria-hidden="true" /> Reabrir
                      </Button>
                    )}
                    {p.estado !== 'descartado' && (
                      <Button size="sm" variant="ghost" onClick={() => cambiarEstado(p, 'descartado')}>
                        <X size={15} aria-hidden="true" /> Descartar
                      </Button>
                    )}
                    {p.estado === 'descartado' && (
                      <Button size="sm" variant="ghost" onClick={() => setToDelete(p)}>
                        <Trash2 size={15} aria-hidden="true" /> Eliminar
                      </Button>
                    )}
                  </div>
                </CardBody>
              </Card>
            );
          })}
        </div>
      )}

      <ConfirmDialog
        open={toDelete !== null}
        title="Eliminar pedido"
        message="Esta acción borra el pedido de forma permanente."
        confirmLabel="Eliminar"
        danger
        loading={deleting}
        onConfirm={eliminarPedido}
        onCancel={() => !deleting && setToDelete(null)}
      />
    </div>
  );
}
