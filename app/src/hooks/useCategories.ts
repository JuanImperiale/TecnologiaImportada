import { useEffect, useState } from 'react';
import { categoryService } from '@/services/categoryService';
import type { Categoria, Negocio } from '@/models';

/** Suscribe en vivo a las categorías de una unidad de negocio. */
export function useCategories(negocio: Negocio) {
  const [categories, setCategories] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    const unsub = categoryService.subscribe(
      negocio,
      (cats) => {
        setCategories(cats);
        setLoading(false);
      },
      (msg) => {
        setError(msg);
        setLoading(false);
      },
    );
    return unsub;
  }, [negocio]);

  return { categories, loading, error };
}
