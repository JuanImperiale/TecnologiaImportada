import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Plus, Search, Download, ChevronRight, RefreshCw } from 'lucide-react';
import { saleService, type VentaCursor } from '@/services/saleService';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { cn, formatMoney, formatUsd, formatDate, monthKey } from '@/lib/utils';
import { medioPagoLabel } from '@/lib/mediosPago';
import { exportarVentasCsv } from '@/lib/ventasCsv';
import type { Venta } from '@/models';

function ventaFecha(v: Venta): Date {
  return (v.creado as unknown as { toDate?: () => Date })?.toDate?.() ?? new Date();
}

type FiltroEstado = 'todas' | 'confirmada' | 'anulada';

const MESES = [
  { value: '01', label: 'Enero' },
  { value: '02', label: 'Febrero' },
  { value: '03', label: 'Marzo' },
  { value: '04', label: 'Abril' },
  { value: '05', label: 'Mayo' },
  { value: '06', label: 'Junio' },
  { value: '07', label: 'Julio' },
  { value: '08', label: 'Agosto' },
  { value: '09', label: 'Septiembre' },
  { value: '10', label: 'Octubre' },
  { value: '11', label: 'Noviembre' },
  { value: '12', label: 'Diciembre' },
];

export function VentasPage() {
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cursor, setCursor] = useState<VentaCursor | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [exportando, setExportando] = useState(false);
  const [q, setQ] = useState('');
  const [estado, setEstado] = useState<FiltroEstado>('todas');
  const [mesExportacion, setMesExportacion] = useState(() => monthKey(new Date()).slice(5));
  const [anioExportacion, setAnioExportacion] = useState(() => monthKey(new Date()).slice(0, 4));

  const cargarPagina = useCallback(async (desde: VentaCursor | null, reemplazar: boolean) => {
    if (reemplazar) setLoading(true);
    else setLoadingMore(true);
    const resultado = await saleService.getPage(30, desde);
    if (resultado.ok) {
      setVentas((actuales) => reemplazar ? resultado.data.ventas : [...actuales, ...resultado.data.ventas]);
      setCursor(resultado.data.cursor);
      setHasMore(resultado.data.hasMore);
      setError(null);
    } else {
      setError(resultado.error.message);
    }
    setLoading(false);
    setLoadingMore(false);
  }, []);

  useEffect(() => {
    void cargarPagina(null, true);
  }, [cargarPagina]);

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

  const anios = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: currentYear - 2000 + 1 }, (_, index) => {
      const value = String(currentYear - index);
      return { value, label: value };
    });
  }, []);
  const periodoExportacion = `${anioExportacion}-${mesExportacion}`;

  const exportarCsv = async () => {
    setExportando(true);
    const resultado = await saleService.getByMonth(periodoExportacion);
    setExportando(false);
    if (!resultado.ok) {
      toast.error(resultado.error.message);
      return;
    }
    if (resultado.data.length === 0) {
      toast.message('No hay ventas en el mes seleccionado.');
      return;
    }
    const csv = exportarVentasCsv(resultado.data, periodoExportacion);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ventas-${periodoExportacion}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight">Ventas</h1>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={() => void cargarPagina(null, true)} disabled={loading}>
            <RefreshCw size={16} aria-hidden="true" /> Actualizar
          </Button>
          <Link to="/adm/ventas/nueva">
            <Button>
              <Plus size={16} aria-hidden="true" /> Nueva venta
            </Button>
          </Link>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap items-end gap-3 rounded-md border border-line bg-surface p-3">
        <Select
          label="Mes para exportar"
          value={mesExportacion}
          onChange={(event) => setMesExportacion(event.target.value)}
          options={MESES}
          className="min-w-[150px]"
        />
        <Select
          label="Año"
          value={anioExportacion}
          onChange={(event) => setAnioExportacion(event.target.value)}
          options={anios}
          className="min-w-[110px]"
        />
        <Button variant="ghost" onClick={() => void exportarCsv()} loading={exportando} disabled={exportando}>
          <Download size={16} aria-hidden="true" /> Exportar mes seleccionado
        </Button>
        <p className="w-full text-xs text-text-soft">
          Incluye todas las ventas del mes, también las anuladas, sin depender de las páginas ni de los filtros visibles.
        </p>
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
        <EmptyState title={ventas.length === 0 ? 'Sin ventas recientes' : 'Sin coincidencias en esta página'} description={ventas.length === 0 ? 'Registrá tu primera venta con “Nueva venta”.' : 'Probá otro filtro o cargá páginas anteriores.'} />
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
                    {v.pago?.medioArs ? ` · ${medioPagoLabel(v.pago.medioArs)}` : ''}
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

      {!loading && !error && hasMore && (
        <div className="mt-4 flex flex-col items-center gap-2">
          <p className="text-xs text-text-soft">Mostrando búsqueda y filtros sobre las {ventas.length} ventas cargadas.</p>
          <Button variant="ghost" onClick={() => void cargarPagina(cursor, false)} loading={loadingMore} disabled={loadingMore}>
            Cargar 30 ventas anteriores
          </Button>
        </div>
      )}
    </div>
  );
}
