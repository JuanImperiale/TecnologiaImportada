import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Plus, Trash2, Copy } from 'lucide-react';
import { useGastos } from '@/hooks/useGastos';
import { gastoService } from '@/services/gastoService';
import { Card, CardBody } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Switch } from '@/components/ui/Switch';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatMoney, formatDate, monthKey, toDate } from '@/lib/utils';
import type { CategoriaGasto } from '@/models';

const CATEGORIAS: { value: CategoriaGasto; label: string }[] = [
  { value: 'alquiler', label: 'Alquiler' },
  { value: 'servicios', label: 'Servicios' },
  { value: 'insumos', label: 'Insumos' },
  { value: 'sueldos', label: 'Sueldos' },
  { value: 'impuestos', label: 'Impuestos' },
  { value: 'otros', label: 'Otros' },
];

function hoyISO() {
  return new Date().toISOString().slice(0, 10);
}
function prevMonth(ym: string) {
  const [y, m] = ym.split('-').map(Number);
  const d = new Date(y, m - 2, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export function GastosPage() {
  const { gastos, loading, error } = useGastos();
  const [ym, setYm] = useState(monthKey(new Date()));

  const [concepto, setConcepto] = useState('');
  const [categoria, setCategoria] = useState<CategoriaGasto>('servicios');
  const [monto, setMonto] = useState('');
  const [fecha, setFecha] = useState(hoyISO());
  const [recurrente, setRecurrente] = useState(false);
  const [saving, setSaving] = useState(false);

  const gastosMes = useMemo(
    () => gastos.filter((g) => monthKey(g.fecha) === ym),
    [gastos, ym],
  );
  const totalMes = gastosMes.reduce((a, g) => a + g.monto, 0);

  const agregar = async () => {
    if (concepto.trim().length < 2 || !(Number(monto) > 0)) {
      toast.error('Completá concepto y un monto válido.');
      return;
    }
    setSaving(true);
    const res = await gastoService.create({
      concepto,
      categoria,
      monto: Number(monto),
      fecha: new Date(`${fecha}T12:00:00`),
      recurrente,
    });
    setSaving(false);
    if (res.ok) {
      toast.success('Gasto agregado.');
      setConcepto('');
      setMonto('');
      setRecurrente(false);
    } else toast.error(res.error.message);
  };

  const clonarRecurrentes = async () => {
    const prev = prevMonth(ym);
    const recurrentesPrev = gastos.filter((g) => g.recurrente && monthKey(g.fecha) === prev);
    const conceptosActuales = new Set(gastosMes.map((g) => g.concepto.toLowerCase()));
    const aClonar = recurrentesPrev.filter((g) => !conceptosActuales.has(g.concepto.toLowerCase()));
    if (aClonar.length === 0) {
      toast.message('No hay gastos recurrentes nuevos para clonar del mes anterior.');
      return;
    }
    const [y, m] = ym.split('-').map(Number);
    const res = await gastoService.clonar(aClonar, new Date(y, m - 1, 1, 12));
    if (res.ok) toast.success(`Se clonaron ${res.data} gastos recurrentes.`);
    else toast.error(res.error.message);
  };

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight">Gastos</h1>
        <input
          type="month"
          value={ym}
          onChange={(e) => setYm(e.target.value)}
          className="h-10 rounded-md border border-line bg-surface-2 px-3 text-sm text-text"
        />
      </div>

      <Card className="mb-5">
        <CardBody className="flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Concepto" value={concepto} onChange={(e) => setConcepto(e.target.value)} />
            <Select label="Categoría" options={CATEGORIAS} value={categoria} onChange={(e) => setCategoria(e.target.value as CategoriaGasto)} />
            <Input label="Monto (ARS)" type="number" value={monto} onChange={(e) => setMonto(e.target.value)} />
            <Input label="Fecha" type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Switch checked={recurrente} onChange={setRecurrente} label="Gasto recurrente (mensual)" />
            <Button onClick={agregar} loading={saving}>
              <Plus size={16} aria-hidden="true" /> Agregar gasto
            </Button>
          </div>
        </CardBody>
      </Card>

      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm text-text-soft">
          Total del mes: <span className="font-bold text-text">{formatMoney(totalMes)}</span>
        </p>
        <Button size="sm" variant="ghost" onClick={clonarRecurrentes}>
          <Copy size={15} aria-hidden="true" /> Clonar recurrentes del mes anterior
        </Button>
      </div>

      {loading ? (
        <Spinner />
      ) : error ? (
        <EmptyState title="Error" description={error} />
      ) : gastosMes.length === 0 ? (
        <EmptyState title="Sin gastos este mes" description="Agregá el primero arriba." />
      ) : (
        <div className="flex flex-col gap-2">
          {gastosMes.map((g) => (
            <Card key={g.id} className="flex items-center gap-3 p-3">
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">
                  {g.concepto}
                  {g.recurrente && <span className="ml-2 text-xs text-text-faint">recurrente</span>}
                </p>
                <p className="text-sm capitalize text-text-soft">
                  {g.categoria} · {formatDate(toDate(g.fecha))}
                </p>
              </div>
              <span className="font-bold">{formatMoney(g.monto)}</span>
              <button
                type="button"
                onClick={() => gastoService.remove(g.id)}
                aria-label="Eliminar gasto"
                className="text-text-soft hover:text-danger"
              >
                <Trash2 size={17} aria-hidden="true" />
              </button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
