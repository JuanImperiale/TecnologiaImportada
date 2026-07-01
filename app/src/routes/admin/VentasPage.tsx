import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Download, ChevronRight } from 'lucide-react';
import { useVentas } from '@/hooks/useVentas';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { cn, formatMoney, formatUsd, formatDate } from '@/lib/utils';
import type { Venta } from '@/models';

function ventaFecha(v: Venta): Date {
  return (v.creado as unknown as { toDate?: () => Date })?.toDate?.() ?? new Date();
}

type FiltroEstado = 'todas' | 'confirmada' | 'anulada';

export function VentasPage() {
  const { ventas, loading, error } = useVentas();
  const [q, setQ] = useState('');
  const [estado, setEstado] = useState<FiltroEstado>('todas');

  const lista = useMemo(() => {
    const term = q.trim().toLowerCase();
    return ventas.filter(
      (v) =>
        (estado === 'todas' || v.estado === estado) &&
        (!term ||
          String(v.numero).includes(term) ||
          (v.cliente?.nombre ?? '').toLowerCase().includes(term)),
    );
  }, [ventas, q, estado]);

  const exportarCsv = () => {
    const cols = ['N°', 'Fecha', 'Cliente', 'Total USD', 'Total ARS', 'Envío', 'Pago USD', 'Pago ARS', 'Medio ARS', 'Estado', 'Facturación', 'N° Factura'];
    const filas = lista.map((v) => [
      v.numero,
      formatDate(ventaFecha(v), 'DD/MM/YYYY HH:mm'),
      v.cliente?.nombre ?? '',
      v.totalUsd,
      v.totalArs,
      v.envio?.costo ?? 0,
      v.pago?.usd ?? 0,
      v.pago?.ars ?? 0,
      v.pago?.medioArs ?? '',
      v.estado,
      v.facturacion?.estado ?? '',
      v.facturacion?.nroFacturaC ?? '',
    ]);
    const csv = [cols, ...filas]
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ventas-${formatDate(new Date(), 'YYYY-MM-DD')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight">Ventas</h1>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={exportarCsv} disabled={lista.length === 0}>
            <Download size={16} aria-hidden="true" /> Exportar CSV
          </Button>
          <Link to="/adm/ventas/nueva">
            <Button>
              <Plus size={16} aria-hidden="true" /> Nueva venta
            </Button>
          </Link>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative min-w-[200px] flex-1">
          <Search size={17} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-soft" aria-hidden="true" />
          <Input placeholder="Buscar por N° o cliente…" value={q} onChange={(e) => setQ(e.target.value)} className="pl-9" />
        </div>
        {(['todas', 'confirmada', 'anulada'] as FiltroEstado[]).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setEstado(f)}
            className={cn(
              'rounded-pill border px-4 py-1.5 text-sm font-medium capitalize transition-colors',
              estado === f ? 'border-transparent bg-accent text-on-accent' : 'border-line bg-surface-2 text-text-soft hover:text-text',
            )}
          >
            {f}
          </button>
        ))}
      </div>

      {loading ? (
        <Spinner />
      ) : error ? (
        <EmptyState title="Error" description={error} />
      ) : lista.length === 0 ? (
        <EmptyState title="Sin ventas" description="Registrá tu primera venta con “Nueva venta”." />
      ) : (
        <div className="flex flex-col gap-2">
          {lista.map((v) => (
            <Link key={v.id} to={`/adm/ventas/${v.id}`}>
              <Card className="flex items-center gap-4 p-3.5 transition-colors hover:border-line-strong">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-surface-2 text-sm font-bold">
                  #{v.numero}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{v.cliente?.nombre || 'Consumidor final'}</p>
                  <p className="text-sm text-text-soft">
                    {formatDate(ventaFecha(v), 'DD/MM/YYYY HH:mm')}
                    {v.pago?.medioArs ? ` · ${v.pago.medioArs}` : ''}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold leading-tight">
                    {v.totalUsd > 0 && <span>{formatUsd(v.totalUsd)}</span>}
                    {v.totalUsd > 0 && (v.totalArs > 0 || (v.envio?.costo ?? 0) > 0) && <span className="text-text-faint"> · </span>}
                    {(v.totalArs > 0 || (v.envio?.costo ?? 0) > 0) && <span>{formatMoney(v.totalArs + (v.envio?.costo ?? 0))}</span>}
                  </p>
                  <div className="flex justify-end gap-1">
                    {v.estado === 'anulada' && <Badge tone="danger">Anulada</Badge>}
                    {v.facturacion?.estado === 'facturada' ? (
                      <Badge tone="success">Facturada</Badge>
                    ) : (
                      <Badge tone="neutral">Sin facturar</Badge>
                    )}
                  </div>
                </div>
                <ChevronRight size={18} className="shrink-0 text-text-faint" aria-hidden="true" />
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
