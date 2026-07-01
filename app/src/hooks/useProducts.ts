import { useEffect, useState } from 'react';
import { productService } from '@/services/productService';
import type { Producto, Negocio } from '@/models';

/** Suscribe en vivo a los productos de una unidad de negocio. */
export function useProducts(negocio: Negocio) {
  const [products, setProducts] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    const unsub = productService.subscribe(
      negocio,
      (items) => {
        setProducts(items);
        setLoading(false);
      },
      (msg) => {
        setError(msg);
        setLoading(false);
      },
    );
    return unsub;
  }, [negocio]);

  return { products, loading, error };
}
