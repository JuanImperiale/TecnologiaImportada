import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Plus, Search, Pencil, Trash2, ImageOff, AlertTriangle, QrCode, Printer, Copy, ExternalLink } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useProducts } from '@/hooks/useProducts';
import { useCategories } from '@/hooks/useCategories';
import { productService } from '@/services/productService';
import { UnitTabs } from '@/components/admin/UnitTabs';
import { useQrPrint } from '@/hooks/useQrPrint';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Switch } from '@/components/ui/Switch';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { ConfirmDialog, Modal } from '@/components/ui/Modal';
import { formatPrice, matchesSearch, productPublicUrl, squareImg } from '@/lib/utils';
import type { Negocio, Producto } from '@/models';

export function InventarioPage() {
  const [negocio, setNegocio] = useState<Negocio>('productos');
  const { products, loading, error } = useProducts(negocio);
  const { categories } = useCategories(negocio);
  const catMap = useMemo(() => new Map(categories.map((c) => [c.id, c.nombre])), [categories]);
  const [q, setQ] = useState('');

  const filtered = useMemo(() => {
    if (!q.trim()) return products;
    return products.filter((p) =>
      matchesSearch(q, p.nombre, p.sku, catMap.get(p.categoriaId) ?? p.categoria),
    );
  }, [products, q, catMap]);

  const stockBajo = products.filter((p) => p.activo && p.stock <= p.stockMinimo).length;

  const [toDelete, setToDelete] = useState<Producto | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [qrProduct, setQrProduct] = useState<Producto | null>(null);
  const { print: printQr, sheet: qrSheet } = useQrPrint();

  const copiarLink = async (id: string) => {
    try {
      await navigator.clipboard.writeText(productPublicUrl(id));
      toast.success('Link copiado.');
    } catch {
      toast.error('No se pudo copiar el link.');
    }
  };

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
                  <button
                    type="button"
                    onClick={() => setQrProduct(p)}
                    disabled={!p.activo}
                    aria-label={`QR de ${p.nombre}`}
                    title={p.activo ? 'Ver e imprimir QR' : 'Activá el producto para usar su QR (inactivo no se ve en la tienda)'}
                    className="flex h-9 w-9 items-center justify-center rounded-md border border-line bg-surface-2 text-text hover:border-line-strong disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <QrCode size={16} aria-hidden="true" />
                  </button>
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

      <Modal
        open={!!qrProduct}
        onClose={() => setQrProduct(null)}
        title="QR del producto"
        footer={
          qrProduct && (
            <>
              <Button variant="ghost" size="sm" onClick={() => copiarLink(qrProduct.id)}>
                <Copy size={15} aria-hidden="true" /> Copiar link
              </Button>
              <a href={productPublicUrl(qrProduct.id)} target="_blank" rel="noreferrer">
                <Button variant="ghost" size="sm">
                  <ExternalLink size={15} aria-hidden="true" /> Abrir
                </Button>
              </a>
              <Button size="sm" onClick={() => printQr([{ id: qrProduct.id, nombre: qrProduct.nombre }])}>
                <Printer size={15} aria-hidden="true" /> Imprimir
              </Button>
            </>
          )
        }
      >
        {qrProduct && (
          <div className="flex flex-col items-center gap-3">
            <div className="rounded-md bg-white p-3">
              <QRCodeSVG value={productPublicUrl(qrProduct.id)} size={200} level="M" marginSize={0} />
            </div>
            <p className="text-center font-semibold">{qrProduct.nombre}</p>
            <p className="break-all text-center text-xs text-text-soft">{productPublicUrl(qrProduct.id)}</p>
          </div>
        )}
      </Modal>
      {qrSheet}

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
