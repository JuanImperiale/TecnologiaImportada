import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { ImageOff, Plus } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { useCart } from '@/hooks/useCart';
import { formatPrice, squareImg } from '@/lib/utils';
import type { Producto } from '@/models';

/** Card de producto para la tienda pública. */
export function ProductCard({ product }: { product: Producto }) {
  const { add } = useCart();
  const moneda = product.monedaVenta ?? 'ARS';
  const sinStock = product.stock <= 0;

  const quickAdd = (e: React.MouseEvent) => {
    e.preventDefault(); // no navegar al detalle
    e.stopPropagation();
    add(product, 1);
    toast.success('Agregado al carrito');
  };
  const tieneDescuento =
    typeof product.precioAnterior === 'number' && product.precioAnterior > product.precioVenta;
  const off = tieneDescuento
    ? Math.round((1 - product.precioVenta / (product.precioAnterior as number)) * 100)
    : 0;

  return (
    <Link
      to={`/producto/${product.id}`}
      className="group flex flex-col overflow-hidden rounded-lg border border-line bg-surface shadow-ti transition-transform hover:-translate-y-1"
    >
      <div className="relative aspect-square bg-surface-2">
        {product.imagenes?.[0] ? (
          <img
            src={squareImg(product.imagenes[0], 600)}
            alt={product.nombre}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-text-faint">
            <ImageOff size={36} aria-hidden="true" />
          </div>
        )}
        {tieneDescuento && (
          <span className="absolute left-3 top-3">
            <Badge tone="sale">-{off}%</Badge>
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-1 p-4">
        {product.categoria && (
          <span className="text-[11px] font-bold uppercase tracking-wider text-text-faint">
            {product.categoria}
          </span>
        )}
        <span className="line-clamp-2 font-medium leading-snug">{product.nombre}</span>
        <div className="mt-auto flex items-end justify-between gap-2 pt-2">
          <div className="min-w-0">
            <span className="text-lg font-extrabold tracking-tight">
              {formatPrice(product.precioVenta, moneda)}
            </span>
            {tieneDescuento && (
              <span className="ml-2 text-sm text-text-faint line-through">
                {formatPrice(product.precioAnterior, moneda)}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={quickAdd}
            disabled={sinStock}
            aria-label={sinStock ? 'Sin stock' : `Agregar ${product.nombre} al carrito`}
            title={sinStock ? 'Sin stock' : 'Agregar al carrito'}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-pill bg-accent text-on-accent transition hover:brightness-110 disabled:opacity-40"
          >
            <Plus size={18} aria-hidden="true" />
          </button>
        </div>
      </div>
    </Link>
  );
}
