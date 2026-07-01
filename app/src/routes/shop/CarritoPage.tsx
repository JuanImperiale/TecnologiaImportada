import { Link } from 'react-router-dom';
import { Minus, Plus, Trash2, ImageOff, ShoppingCart } from 'lucide-react';
import { useCart } from '@/hooks/useCart';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatPrice, formatMoney, formatUsd, squareImg } from '@/lib/utils';

export function CarritoPage() {
  const { items, totals, setQty, remove } = useCart();

  if (items.length === 0) {
    return (
      <EmptyState
        icon={<ShoppingCart size={36} />}
        title="Tu carrito está vacío"
        description="Agregá productos desde el catálogo."
        action={
          <Link to="/catalogo">
            <Button>Ver catálogo</Button>
          </Link>
        }
      />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold tracking-tight">Tu carrito ({items.length})</h1>

      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        {/* Líneas */}
        <div className="flex flex-col gap-3">
          {items.map((i) => (
            <Card key={i.productId} className="overflow-hidden p-3">
              <div className="grid grid-cols-[64px_1fr] gap-3 sm:grid-cols-[64px_1fr_auto_auto] sm:items-center sm:gap-4">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-md bg-surface-2">
                  {i.imagen ? (
                    <img src={squareImg(i.imagen, 120)} alt={i.nombre} className="h-full w-full object-cover" />
                  ) : (
                    <ImageOff size={22} className="text-text-faint" aria-hidden="true" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="truncate font-medium">{i.nombre}</p>
                  <p className="text-sm text-text-soft">{formatPrice(i.precioMostrado, i.monedaVenta)}</p>
                </div>
                <div className="col-span-2 flex items-center justify-between gap-2 sm:col-span-1 sm:justify-start">
                  <div className="inline-flex items-center overflow-hidden rounded-md border border-line">
                    <button
                      type="button"
                      onClick={() => setQty(i.productId, i.cantidad - 1)}
                      aria-label="Restar"
                      className="flex h-9 w-9 items-center justify-center bg-surface-2 hover:text-accent"
                    >
                      <Minus size={15} aria-hidden="true" />
                    </button>
                    <span className="w-9 text-center text-sm font-medium">{i.cantidad}</span>
                    <button
                      type="button"
                      onClick={() => setQty(i.productId, i.cantidad + 1)}
                      aria-label="Sumar"
                      className="flex h-9 w-9 items-center justify-center bg-surface-2 hover:text-accent"
                    >
                      <Plus size={15} aria-hidden="true" />
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => remove(i.productId)}
                    aria-label={`Quitar ${i.nombre}`}
                    className="text-text-soft hover:text-danger"
                  >
                    <Trash2 size={18} aria-hidden="true" />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Resumen */}
        <Card className="h-fit p-5 lg:sticky lg:top-2">
          <h2 className="mb-4 text-lg font-bold">Resumen</h2>
          <div className="flex flex-col gap-2 border-b border-line pb-3">
            {totals.usd > 0 && (
              <div className="flex justify-between text-text-soft">
                <span>Subtotal en dólares</span>
                <span className="font-bold text-text">{formatUsd(totals.usd)}</span>
              </div>
            )}
            {totals.ars > 0 && (
              <div className="flex justify-between text-text-soft">
                <span>Subtotal en pesos</span>
                <span className="font-bold text-text">{formatMoney(totals.ars)}</span>
              </div>
            )}
          </div>
          <p className="py-3 text-sm text-text-soft">
            Los productos en dólares y en pesos se totalizan por separado. El precio final y el
            envío se coordinan por WhatsApp al confirmar.
          </p>
          <Link to="/carrito/confirmar">
            <Button className="w-full">Confirmar pedido</Button>
          </Link>
        </Card>
      </div>
    </div>
  );
}
