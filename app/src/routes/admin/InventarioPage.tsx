import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Plus, Search, Pencil, Trash2, ImageOff, AlertTriangle } from 'lucide-react';
import { useProducts } from '@/hooks/useProducts';
import { useCategories } from '@/hooks/useCategories';
import { productService } from '@/services/productService';
import { UnitTabs } from '@/components/admin/UnitTabs';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Switch } from '@/components/ui/Switch';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { ConfirmDialog } from '@/components/ui/Modal';
import { formatPrice, squareImg } from '@/lib/utils';
import type { Negocio, Producto } from '@/models';

export function InventarioPage() {
  const [negocio, setNegocio] = useState<Negocio>('productos');
  const { products, loading, error } = useProducts(negocio);
  const { categories } = useCategories(negocio);
  const catMap = useMemo(() => new Map(categories.map((c) => [c.id, c.nombre])), [categories]);
  const [q, setQ] = useState('');

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return products;
    return products.filter(
      (p) =>
        p.nombre.toLowerCase().includes(term) ||
        (p.sku ?? '').toLowerCase().includes(term) ||
        (catMap.get(p.categoriaId) ?? p.categoria ?? '').toLowerCase().includes(term),
    );
  }, [products, q]);

  const stockBajo = products.filter((p) => p.activo && p.stock <= p.stockMinimo).length;

  const [toDelete, setToDelete] = useState<Producto | null>(null);
  const [deleting, setDeleting] = useState(false);

  const toggleActivo = async (id: string, activo: boolean) => {
    const res = await productService.setActivo(id, activo);
    if (!res.ok) toast.error(res.error.message);
    else toast.success(activo ? 'Producto activado.' : 'Producto desactivado.');
  };

  const eliminar = async () => {
    if (!toDelete) return;
    setDeleting(true);
    const res = await productService.remove(toDelete.id);
    setDeleting(false);
    setToDelete(null);
    if (res.ok) toast.success('Producto eliminado.');
    else toast.error(res.error.message);
  };

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Inventario</h1>
          {stockBajo > 0 && (
            <p className="mt-1 flex items-center gap-1.5 text-sm text-warning">
              <AlertTriangle size={15} aria-hidden="true" /> {stockBajo} con stock bajo
            </p>
          )}
        </div>
        <UnitTabs value={negocio} onChange={setNegocio} />
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative min-w-[220px] flex-1">
          <Search
            size={17}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-soft"
            aria-hidden="true"
          />
          <Input
            placeholder="Buscar por nombre, SKU o categoría…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="pl-9"
          />
        </div>
        <Link to={`/adm/inventario/nuevo?negocio=${negocio}`}>
          <Button>
            <Plus size={16} aria-hidden="true" /> Nuevo producto
          </Button>
        </Link>
      </div>

      {loading ? (
        <Spinner />
      ) : error ? (
        <EmptyState title="Error" description={error} />
      ) : filtered.length === 0 ? (
        <EmptyState
          title={q ? 'Sin resultados' : 'Sin productos'}
          description={q ? 'Probá con otra búsqueda.' : 'Agregá tu primer producto con "Nuevo producto".'}
        />
      ) : (
        <div className="flex flex-col gap-2">
          {filtered.map((p) => {
            const bajo = p.stock <= p.stockMinimo;
            return (
              <Card key={p.id} className="flex items-center gap-4 p-3">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-md bg-surface-2">
                  {p.imagenes?.[0] ? (
                    <img src={squareImg(p.imagenes[0], 120)} alt={p.nombre} className="h-full w-full object-cover" />
                  ) : (
                    <ImageOff size={22} className="text-text-faint" aria-hidden="true" />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate font-medium">{p.nombre}</p>
                    {!p.activo && <Badge tone="neutral">Inactivo</Badge>}
                  </div>
                  <p className="truncate text-sm text-text-soft">
                    {catMap.get(p.categoriaId) ?? p.categoria ?? 'Sin categoría'} · {formatPrice(p.precioVenta, p.monedaVenta ?? 'ARS')}
                  </p>
                </div>

                <div className="hidden text-right sm:block">
                  <p className="text-sm text-text-soft">Stock</p>
                  <p className={bajo ? 'font-bold text-warning' : 'font-bold'}>{p.stock}</p>
                </div>

                <div className="flex items-center gap-2 sm:gap-3">
                  <Switch checked={p.activo} onChange={(v) => toggleActivo(p.id, v)} />
                  <Link
                    to={`/adm/inventario/${p.id}`}
                    aria-label={`Editar ${p.nombre}`}
                    className="flex h-9 w-9 items-center justify-center rounded-md border border-line bg-surface-2 text-text hover:border-line-strong"
                  >
                    <Pencil size={16} aria-hidden="true" />
                  </Link>
                  <button
                    type="button"
                    onClick={() => setToDelete(p)}
                    aria-label={`Eliminar ${p.nombre}`}
                    className="flex h-9 w-9 items-center justify-center rounded-md border border-line bg-surface-2 text-text-soft hover:border-danger hover:text-danger"
                  >
                    <Trash2 size={16} aria-hidden="true" />
                  </button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <ConfirmDialog
        open={!!toDelete}
        title="Eliminar producto"
        message={`¿Eliminar "${toDelete?.nombre}" definitivamente? Esta acción no se puede deshacer. Las ventas ya registradas conservan su detalle. Si solo querés ocultarlo de la tienda, usá el interruptor de activo.`}
        confirmLabel="Eliminar"
        danger
        loading={deleting}
        onConfirm={eliminar}
        onCancel={() => setToDelete(null)}
      />
    </div>
  );
}
