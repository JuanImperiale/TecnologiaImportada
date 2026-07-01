import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Bell, AlertTriangle, Receipt, TrendingUp } from 'lucide-react';
import { useVentas } from '@/hooks/useVentas';
import { usePedidos } from '@/hooks/usePedidos';
import { useCatalog } from '@/hooks/useCatalog';
import { Card, CardBody } from '@/components/ui/Card';
import { Spinner } from '@/components/ui/Spinner';
import { formatMoney, formatUsd, monthKey, toDate, formatDate } from '@/lib/utils';

function Metric({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-lg border border-line bg-surface p-4 shadow-ti">
      <p className="text-[13px] text-text-soft">{label}</p>
      <p className="text-2xl font-extrabold tracking-tight">{value}</p>
      {hint && <p className="text-xs text-text-faint">{hint}</p>}
    </div>
  );
}

export function DashboardPage() {
  const { ventas, loading: lv } = useVentas();
  const { pedidos, pendientes } = usePedidos();
  const { all, loading: lp } = useCatalog();

  const ym = monthKey(new Date());
  const hoy = formatDate(new Date(), 'YYYY-MM-DD');

  const data = useMemo(() => {
    const mes = ventas.filter((v) => v.estado === 'confirmada' && monthKey(v.creado) === ym);
    const hoyVentas = mes.filter((v) => formatDate(toDate(v.creado), 'YYYY-MM-DD') === hoy);
    const totalUsd = mes.reduce((a, v) => a + v.totalUsd, 0);
    const totalArs = mes.reduce((a, v) => a + v.totalArs + (v.envio?.costo ?? 0), 0);

    // Top productos del mes (por cantidad vendida, items tipo venta)
    const conteo = new Map<string, { nombre: string; cant: number }>();
    for (const v of mes)
      for (const it of v.items)
        if (it.tipo === 'venta') {
          const prev = conteo.get(it.productId) ?? { nombre: it.nombre, cant: 0 };
          prev.cant += it.cantidad;
          conteo.set(it.productId, prev);
        }
    const top = [...conteo.values()].sort((a, b) => b.cant - a.cant).slice(0, 5);

    const stockBajo = all.filter((p) => p.stock <= p.stockMinimo);
    return { mes, hoyVentas, totalUsd, totalArs, top, stockBajo };
  }, [ventas, all, ym, hoy]);

  if (lv || lp) return <Spinner />;

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="mb-5 text-2xl font-bold tracking-tight">Dashboard</h1>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Metric label="Ventas del mes" value={String(data.mes.length)} hint={`${data.hoyVentas.length} hoy`} />
        <Metric label="Facturado USD" value={formatUsd(data.totalUsd)} hint="del mes" />
        <Metric label="Facturado ARS" value={formatMoney(data.totalArs)} hint="del mes" />
        <Metric label="Consultas pendientes" value={String(pendientes)} hint={`${pedidos.length} en total`} />
      </div>

      <div className="mt-6 grid gap-5 md:grid-cols-2">
        {/* Top productos */}
        <Card>
          <CardBody>
            <h2 className="mb-3 flex items-center gap-2 text-base font-bold">
              <TrendingUp size={18} aria-hidden="true" /> Top productos del mes
            </h2>
            {data.top.length === 0 ? (
              <p className="text-sm text-text-soft">Sin ventas este mes.</p>
            ) : (
              <ol className="flex flex-col gap-1.5 text-sm">
                {data.top.map((t, i) => (
                  <li key={i} className="flex justify-between">
                    <span className="truncate">{i + 1}. {t.nombre}</span>
                    <span className="font-bold">{t.cant}</span>
                  </li>
                ))}
              </ol>
            )}
          </CardBody>
        </Card>

        {/* Stock bajo */}
        <Card>
          <CardBody>
            <h2 className="mb-3 flex items-center gap-2 text-base font-bold">
              <AlertTriangle size={18} className="text-warning" aria-hidden="true" /> Stock bajo
            </h2>
            {data.stockBajo.length === 0 ? (
              <p className="text-sm text-text-soft">Todo con stock suficiente.</p>
            ) : (
              <ul className="flex flex-col gap-1.5 text-sm">
                {data.stockBajo.slice(0, 6).map((p) => (
                  <li key={p.id} className="flex justify-between">
                    <Link to={`/adm/inventario/${p.id}`} className="truncate hover:underline">{p.nombre}</Link>
                    <span className="font-bold text-warning">{p.stock}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        <Link to="/adm/notificaciones" className="inline-flex items-center gap-2 rounded-md border border-line bg-surface px-4 py-2.5 text-sm font-medium hover:border-line-strong">
          <Bell size={16} aria-hidden="true" /> Ver notificaciones
        </Link>
        <Link to="/adm/ventas/nueva" className="inline-flex items-center gap-2 rounded-md border border-line bg-surface px-4 py-2.5 text-sm font-medium hover:border-line-strong">
          <Receipt size={16} aria-hidden="true" /> Nueva venta
        </Link>
      </div>
    </div>
  );
}
