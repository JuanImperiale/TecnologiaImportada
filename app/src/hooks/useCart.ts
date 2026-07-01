import { useCallback, useEffect, useState } from 'react';
import { cartService, CART_EVENT } from '@/services/cartService';
import type { ItemCarrito, Producto } from '@/models';

/**
 * Carrito reactivo basado en localStorage. Se sincroniza entre pestañas
 * (evento `storage`) y dentro de la misma pestaña (evento propio CART_EVENT).
 */
export function useCart() {
  const [items, setItems] = useState<ItemCarrito[]>(() => cartService.get());

  useEffect(() => {
    const refresh = () => setItems(cartService.get());
    window.addEventListener('storage', refresh);
    window.addEventListener(CART_EVENT, refresh);
    return () => {
      window.removeEventListener('storage', refresh);
      window.removeEventListener(CART_EVENT, refresh);
    };
  }, []);

  const add = useCallback((product: Producto, cantidad = 1) => cartService.add(product, cantidad), []);
  const setQty = useCallback((id: string, cantidad: number) => cartService.setQty(id, cantidad), []);
  const remove = useCallback((id: string) => cartService.remove(id), []);
  const clear = useCallback(() => cartService.clear(), []);

  return {
    items,
    count: cartService.count(items),
    totals: cartService.totals(items),
    add,
    setQty,
    remove,
    clear,
  };
}
