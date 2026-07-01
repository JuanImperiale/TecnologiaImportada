import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { ArrowLeft, ImageOff, ShoppingCart, Minus, Plus } from 'lucide-react';
import { productService } from '@/services/productService';
import { useCart } from '@/hooks/useCart';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { cn, formatPrice, squareImg } from '@/lib/utils';
import type { Producto } from '@/models';

export function ProductDetailPage() {
  const { id } = useParams();
  const { add } = useCart();
  const [product, setProduct] = useState<Producto | null>(null);
  const [loading, setLoading] = useState(true);
  const [sel, setSel] = useState(0);
  const [qty, setQty] = useState(1);

  useEffect(() => {
    if (!id) return;
    let active = true;
    setLoading(true);

    const cached = productService.getCachedActive().find((p) => p.id === id && p.activo);
    if (cached) {
      setProduct(cached);
      setSel(0);
      setLoading(false);
    }

    productService.get(id).then((res) => {
      if (!active) return;
      // Solo se muestra si existe y está activo (visible en la tienda)
      const p = res.ok && res.data && res.data.activo ? res.data : null;
      setProduct(p);
      setSel(0);
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [id]);

  if (loading) return <Spinner />;
  if (!product) {
    return (
      <EmptyState
        title="Producto no encontrado"
        description="Puede que ya no esté disponible."
        action={
          <Link to="/catalogo">
            <Button variant="ghost">Volver al catálogo</Button>
          </Link>
        }
      />
    );
  }

  const moneda = product.monedaVenta ?? 'ARS';
  const tieneDescuento =
    typeof product.precioAnterior === 'number' && product.precioAnterior > product.precioVenta;
  const specs = Object.entries(product.specs ?? {});
  const imagenes = product.imagenes ?? [];

  return (
    <div className="flex flex-col gap-6">
      <Link
        to="/catalogo"
        className="inline-flex items-center gap-1.5 text-sm text-text-soft hover:text-text"
      >
        <ArrowLeft size={16} aria-hidden="true" /> Volver al catálogo
      </Link>

      <div className="grid gap-8 md:grid-cols-2">
        {/* Galería */}
        <div className="flex flex-col gap-3">
          <div className="flex aspect-square items-center justify-center overflow-hidden rounded-lg border border-line bg-surface-2">
            {imagenes[sel] ? (
              <img src={squareImg(imagenes[sel], 800)} alt={product.nombre} className="h-full w-full object-cover" />
            ) : (
              <ImageOff size={48} className="text-text-faint" aria-hidden="true" />
            )}
          </div>
          {imagenes.length > 1 && (
            <div className="flex flex-wrap gap-2">
              {imagenes.map((url, i) => (
                <button
                  key={url}
                  type="button"
                  onClick={() => setSel(i)}
                  aria-label={`Ver imagen ${i + 1} de ${imagenes.length}`}
                  title={`Ver imagen ${i + 1}`}
                  className={cn(
                    'h-16 w-16 overflow-hidden rounded-md border',
                    i === sel ? 'border-accent' : 'border-line',
                  )}
                >
                  <img src={squareImg(url, 160)} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex flex-col gap-4">
          {product.categoria && (
            <span className="text-[11px] font-bold uppercase tracking-wider text-text-faint">
              {product.categoria}
            </span>
          )}
          <h1 className="text-3xl font-bold tracking-tight">{product.nombre}</h1>

          <div className="flex flex-wrap items-baseline gap-3">
            <span className="text-3xl font-extrabold tracking-tight">
              {formatPrice(product.precioVenta, moneda)}
            </span>
            {tieneDescuento && (
              <span className="text-lg text-text-faint line-through">
                {formatPrice(product.precioAnterior, moneda)}
              </span>
            )}
            {tieneDescuento && <Badge tone="sale">Oferta</Badge>}
          </div>
          <p className={product.stock > 0 ? 'text-sm text-success' : 'text-sm text-danger'}>
            {product.stock > 0 ? 'En stock' : 'Sin stock'}
          </p>

          {product.descripcion && (
            <p className="leading-relaxed text-text-soft">{product.descripcion}</p>
          )}

          {product.stock > 0 && (
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <div className="inline-flex items-center overflow-hidden rounded-md border border-line">
                <button
                  type="button"
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  aria-label="Restar"
                  className="flex h-11 w-11 items-center justify-center bg-surface-2 hover:text-accent"
                >
                  <Minus size={16} aria-hidden="true" />
                </button>
                <span className="w-10 text-center font-medium">{qty}</span>
                <button
                  type="button"
                  onClick={() => setQty((q) => Math.min(product.stock, q + 1))}
                  aria-label="Sumar"
                  className="flex h-11 w-11 items-center justify-center bg-surface-2 hover:text-accent"
                >
                  <Plus size={16} aria-hidden="true" />
                </button>
              </div>
              <Button
                className="flex-1 sm:flex-none"
                onClick={() => {
                  add(product, qty);
                  toast.success('Agregado al carrito');
                }}
              >
                <ShoppingCart size={16} aria-hidden="true" /> Agregar al carrito
              </Button>
            </div>
          )}

          {specs.length > 0 && (
            <div className="mt-2 border-t border-line pt-4">
              <h2 className="mb-2 text-base font-bold">Especificaciones</h2>
              <table className="w-full text-sm">
                <tbody>
                  {specs.map(([k, v]) => (
                    <tr key={k} className="border-b border-line">
                      <td className="py-2 text-text-soft">{k}</td>
                      <td className="py-2 text-right font-medium">{v}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
