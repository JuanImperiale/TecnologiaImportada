import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Search, Trash2, Truck } from 'lucide-react';
import { useCatalog } from '@/hooks/useCatalog';
import { importService } from '@/services/importService';
import { Card, CardBody } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import type { Producto } from '@/models';

interface Linea {
  productId: string;
  nombre: string;
  moneda: 'USD' | 'ARS';
  cantidad: number;
  costo: number;
}

function hoyISO() {
  return new Date().toISOString().slice(0, 10);
}

export function ImportacionesPage() {
  const { all } = useCatalog();
  const [proveedor, setProveedor] = useState('');
  const [fecha, setFecha] = useState(hoyISO());
  const [busqueda, setBusqueda] = useState('');
  const [lineas, setLineas] = useState<Linea[]>([]);
  const [guardando, setGuardando] = useState(false);

  const candidatos = useMemo(() => {
    const term = busqueda.trim().toLowerCase();
    if (!term) return [];
    return all.filter((p) => !lineas.some((l) => l.productId === p.id) && p.nombre.toLowerCase().includes(term)).slice(0, 6);
  }, [busqueda, all, lineas]);

  const agregar = (p: Producto) => {
    setLineas((prev) => [
      ...prev,
      { productId: p.id, nombre: p.nombre, moneda: p.monedaVenta ?? 'ARS', cantidad: 1, costo: p.costo },
    ]);
    setBusqueda('');
  };
  const update = (id: string, patch: Partial<Linea>) =>
    setLineas((prev) => prev.map((l) => (l.productId === id ? { ...l, ...patch } : l)));
  const quitar = (id: string) => setLineas((prev) => prev.filter((l) => l.productId !== id));

  const confirmar = async () => {
    if (lineas.length === 0) {
      toast.error('Agregá al menos un producto al lote.');
      return;
    }
    setGuardando(true);
    const res = await importService.crearLote({
      proveedor,
      fecha: new Date(`${fecha}T12:00:00`),
      items: lineas.map((l) => ({ productId: l.productId, nombre: l.nombre, cantidad: l.cantidad, costo: l.costo })),
    });
    setGuardando(false);
    if (res.ok) {
      toast.success('Lote registrado. Stock actualizado.');
      setLineas([]);
      setProveedor('');
    } else toast.error(res.error.message);
  };

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-1 text-2xl font-bold tracking-tight">Importaciones</h1>
      <p className="mb-5 text-sm text-text-soft">Registrá un lote para sumar stock y, si querés, actualizar el costo de cada producto.</p>

      <Card className="mb-5">
        <CardBody className="grid gap-4 sm:grid-cols-2">
          <Input label="Proveedor" value={proveedor} onChange={(e) => setProveedor(e.target.value)} />
          <Input label="Fecha de arribo" type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
        </CardBody>
      </Card>

      <Card>
        <CardBody className="flex flex-col gap-3">
          <div className="relative">
            <Search size={17} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-soft" aria-hidden="true" />
            <Input placeholder="Buscar producto…" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} className="pl-9" />
            {candidatos.length > 0 && (
              <div className="absolute z-10 mt-1 w-full overflow-hidden rounded-md border border-line bg-surface shadow-ti">
                {candidatos.map((p) => (
                  <button key={p.id} type="button" onClick={() => agregar(p)} className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm hover:bg-surface-2">
                    <span className="truncate">{p.nombre}</span>
                    <span className="shrink-0 text-text-soft">{p.monedaVenta} · stock {p.stock}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {lineas.length === 0 ? (
            <EmptyState icon={<Truck size={32} />} title="Lote vacío" description="Agregá productos para ingresar stock." />
          ) : (
            <div className="flex flex-col gap-2">
              {lineas.map((l) => (
                <div key={l.productId} className="flex flex-wrap items-center gap-2 rounded-md border border-line p-2.5">
                  <span className="min-w-0 flex-1 truncate text-sm font-medium">{l.nombre} <span className="text-text-faint">({l.moneda})</span></span>
                  <label className="text-xs text-text-soft">Cant.
                    <input type="number" min={1} value={l.cantidad} onChange={(e) => update(l.productId, { cantidad: Math.max(1, Number(e.target.value) || 1) })} className="ml-1 h-9 w-16 rounded-md border border-line bg-surface-2 px-2 text-center text-sm" />
                  </label>
                  <label className="text-xs text-text-soft">Costo
                    <input type="number" value={l.costo} onChange={(e) => update(l.productId, { costo: Number(e.target.value) || 0 })} className="ml-1 h-9 w-24 rounded-md border border-line bg-surface-2 px-2 text-right text-sm" />
                  </label>
                  <button type="button" onClick={() => quitar(l.productId)} aria-label="Quitar" className="text-text-soft hover:text-danger">
                    <Trash2 size={17} aria-hidden="true" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-end">
            <Button onClick={confirmar} loading={guardando} disabled={lineas.length === 0}>
              Registrar lote e ingresar stock
            </Button>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
