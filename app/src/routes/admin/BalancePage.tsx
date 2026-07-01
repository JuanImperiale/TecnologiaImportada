import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Gift } from 'lucide-react';
import { useVentas } from '@/hooks/useVentas';
import { useGastos } from '@/hooks/useGastos';
import { computeBalance } from '@/services/balanceService';
import { Card, CardBody } from '@/components/ui/Card';
import { Select } from '@/components/ui/Select';
import { Spinner } from '@/components/ui/Spinner';
import { formatMoney, formatUsd, monthKey } from '@/lib/utils';

type Fmt = (n: number) => string;

const MONTH_OPTIONS = [
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

function Metric({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="rounded-md bg-surface-2 p-4">
      <p className="text-[13px] text-text-soft">{label}</p>
      <p className={strong ? 'text-xl font-extrabold tracking-tight' : 'text-lg font-bold tracking-tight'}>{value}</p>
    </div>
  );
}

function BloqueUnidad({
  titulo,
  bloque,
  fmt,
}: {
  titulo: string;
  bloque: { ingresos: { productos: number; accesorios: number }; costo: { productos: number; accesorios: number }; margen: { productos: number; accesorios: number; total: number } };
  fmt: Fmt;
}) {
  return (
    <Card>
      <CardBody>
        <h2 className="mb-3 text-base font-bold">{titulo}</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-text-soft">
              <th className="text-left font-medium"></th>
              <th className="py-1 text-right font-medium">Ingresos</th>
              <th className="py-1 text-right font-medium">Costo</th>
              <th className="py-1 text-right font-medium">Margen</th>
            </tr>
          </thead>
          <tbody>
            {(['productos', 'accesorios'] as const).map((u) => (
              <tr key={u} className="border-t border-line">
                <td className="py-2 font-medium capitalize">{u}</td>
                <td className="py-2 text-right">{fmt(bloque.ingresos[u])}</td>
                <td className="py-2 text-right text-text-soft">{fmt(bloque.costo[u])}</td>
                <td className="py-2 text-right font-bold">{fmt(bloque.margen[u])}</td>
              </tr>
            ))}
            <tr className="border-t-2 border-line-strong">
              <td className="py-2 font-bold">Margen total</td>
              <td></td>
              <td></td>
              <td className="py-2 text-right font-extrabold">{fmt(bloque.margen.total)}</td>
            </tr>
          </tbody>
        </table>
      </CardBody>
    </Card>
  );
}

export function BalancePage() {
  const { ventas, loading: lv } = useVentas();
  const { gastos, loading: lg } = useGastos();
  const [ym, setYm] = useState(monthKey(new Date()));
  const b = useMemo(() => computeBalance(ventas, gastos, ym), [ventas, gastos, ym]);
  const loading = lv || lg;
  const [year, month] = ym.split('-');
  const yearOptions = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 6 }, (_, idx) => {
      const value = String(currentYear - idx);
      return { value, label: value };
    });
  }, []);

  const updateMonth = (nextMonth: string) => setYm(`${year}-${nextMonth}`);
  const updateYear = (nextYear: string) => setYm(`${nextYear}-${month}`);

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight">Balance mensual</h1>
        <div className="grid w-full gap-3 sm:w-auto sm:grid-cols-2">
          <Select label="Mes" value={month} onChange={(e) => updateMonth(e.target.value)} options={MONTH_OPTIONS} />
          <Select label="Año" value={year} onChange={(e) => updateYear(e.target.value)} options={yearOptions} />
        </div>
      </div>

      {loading ? (
        <Spinner />
      ) : (
        <div className="flex flex-col gap-5">
          <p className="text-sm text-text-soft">{b.ventasCount} venta(s) en el mes. Lo vendido en dólares y en pesos se muestra por separado (sin conversión).</p>

          {/* Resultado por moneda */}
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-3 rounded-lg border border-line p-4">
              <p className="font-bold">En dólares</p>
              <Metric label="Margen bruto" value={formatUsd(b.usd.margen.total)} />
              <Metric label="Resultado en USD" value={formatUsd(b.netaUsd)} strong />
            </div>
            <div className="flex flex-col gap-3 rounded-lg border border-line p-4">
              <p className="font-bold">En pesos</p>
              <div className="grid grid-cols-2 gap-3">
                <Metric label="Margen bruto" value={formatMoney(b.ars.margen.total)} />
                <Metric label="Envíos" value={formatMoney(b.envios)} />
                <Metric label="Gastos" value={formatMoney(b.gastos)} />
                <Metric label="Ganancia neta" value={formatMoney(b.netaArs)} strong />
              </div>
            </div>
          </div>

          {/* Detalle por unidad, por moneda */}
          {b.usd.ingresos.total > 0 || b.usd.costo.total > 0 ? (
            <BloqueUnidad titulo="Dólares — Productos vs Accesorios" bloque={b.usd} fmt={formatUsd} />
          ) : null}
          {b.ars.ingresos.total > 0 || b.ars.costo.total > 0 ? (
            <BloqueUnidad titulo="Pesos — Productos vs Accesorios" bloque={b.ars} fmt={formatMoney} />
          ) : null}

          {/* Bonificaciones */}
          {(b.usd.bonifUnidades > 0 || b.ars.bonifUnidades > 0) && (
            <Card>
              <CardBody className="flex items-center gap-3">
                <Gift size={20} className="text-info" aria-hidden="true" />
                <div className="flex-1 text-sm">
                  <p className="font-bold">Bonificaciones del mes</p>
                  <p className="text-text-soft">
                    {b.usd.bonifUnidades + b.ars.bonifUnidades} unidad(es) regaladas · costo absorbido{' '}
                    {b.usd.bonifCosto > 0 && formatUsd(b.usd.bonifCosto)}
                    {b.usd.bonifCosto > 0 && b.ars.bonifCosto > 0 && ' + '}
                    {b.ars.bonifCosto > 0 && formatMoney(b.ars.bonifCosto)}
                  </p>
                </div>
              </CardBody>
            </Card>
          )}

          <p className="text-sm text-text-soft">
            Los gastos (en pesos) se cargan en{' '}
            <Link to="/adm/gastos" className="font-medium text-text underline">Gastos</Link>. El costo de las
            bonificaciones se reasigna a la unidad que cobró, en su misma moneda.
          </p>
        </div>
      )}
    </div>
  );
}
