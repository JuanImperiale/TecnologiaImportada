import type { ItemCarrito, Producto } from '@/models';

const KEY = 'ti-cart';
/** Evento propio para refrescar el carrito en la MISMA pestaña (storage solo dispara en otras). */
export const CART_EVENT = 'ti-cart-changed';

function read(): ItemCarrito[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as ItemCarrito[]) : [];
  } catch {
    return [];
  }
}

function write(items: ItemCarrito[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(items));
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new Event(CART_EVENT));
}

export const cartService = {
  get: read,

  /** Agrega un producto (o suma cantidad). Topea en el stock disponible. */
  add(product: Producto, cantidad = 1) {
    const items = read();
    const existing = items.find((i) => i.productId === product.id);
    const max = product.stock ?? Infinity;
    if (existing) {
      existing.cantidad = Math.min(existing.cantidad + cantidad, max);
    } else {
      items.push({
        productId: product.id,
        nombre: product.nombre,
        negocio: product.negocio,
        cantidad: Math.min(cantidad, max),
        precioUnitario: product.precioVenta,
        monedaVenta: product.monedaVenta ?? 'ARS',
        precioMostrado: product.precioVenta,
        imagen: product.imagenes?.[0],
      });
    }
    write(items);
  },

  setQty(productId: string, cantidad: number) {
    const items = read()
      .map((i) => (i.productId === productId ? { ...i, cantidad: Math.max(1, cantidad) } : i))
      .filter((i) => i.cantidad > 0);
    write(items);
  },

  remove(productId: string) {
    write(read().filter((i) => i.productId !== productId));
  },

  clear() {
    write([]);
  },

  /** Totales separados por moneda (sin conversión), usando el precio en su moneda. */
  totals(items: ItemCarrito[]): { usd: number; ars: number } {
    return items.reduce(
      (acc, i) => {
        const sub = i.precioMostrado * i.cantidad;
        if (i.monedaVenta === 'USD') acc.usd += sub;
        else acc.ars += sub;
        return acc;
      },
      { usd: 0, ars: 0 },
    );
  },

  count(items: ItemCarrito[]): number {
    return items.reduce((acc, i) => acc + i.cantidad, 0);
  },
};
