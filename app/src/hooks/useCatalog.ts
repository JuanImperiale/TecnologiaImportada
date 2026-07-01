import { useEffect, useMemo, useState } from 'react';
import { productService } from '@/services/productService';
import { categoryService } from '@/services/categoryService';
import type { Producto, Categoria, Negocio } from '@/models';

interface CatalogFilters {
  negocio?: Negocio | 'todos';
  categoriaId?: string;
  search?: string;
}

/**
 * Catálogo público: suscribe a los productos activos (ambas unidades) y aplica
 * filtros en el cliente (unidad, categoría, búsqueda).
 */
export function useCatalog(filters: CatalogFilters = {}) {
  const [all, setAll] = useState<Producto[]>(() => productService.getCachedActive());
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(all.length === 0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (all.length === 0) setLoading(true);
    setError(null);

    if (all.length === 0) {
      productService.getActiveFirstPage().then((res) => {
        if (res.ok && res.data.length > 0) {
          setAll(res.data);
          setLoading(false);
        }
      });
    }

    const unsubProducts = productService.subscribeActive(
      (items) => {
        setAll(items);
        setLoading(false);
      },
      (msg) => {
        setError(msg);
        setLoading(false);
      },
    );

    const unsubCats = categoryService.subscribeAll(
      (cats) => setCategorias(cats),
      () => { /* categorías no bloquean la carga */ },
    );

    return () => {
      unsubProducts();
      unsubCats();
    };
  }, []);

  const catMap = useMemo(
    () => new Map(categorias.map((c) => [c.id, c.nombre])),
    [categorias],
  );

  const products = useMemo(() => {
    let list = all;
    if (filters.negocio && filters.negocio !== 'todos') {
      list = list.filter((p) => p.negocio === filters.negocio);
    }
    if (filters.categoriaId) {
      list = list.filter((p) => p.categoriaId === filters.categoriaId);
    }
    const term = filters.search?.trim().toLowerCase();
    if (term) {
      list = list.filter(
        (p) =>
          p.nombre.toLowerCase().includes(term) ||
          (p.descripcion ?? '').toLowerCase().includes(term) ||
          (catMap.get(p.categoriaId) ?? p.categoria ?? '').toLowerCase().includes(term),
      );
    }
    return list;
  }, [all, filters.negocio, filters.categoriaId, filters.search, catMap]);

  const featured = useMemo(() => all.filter((p) => p.destacado), [all]);

  return { products, all, featured, categorias, catMap, loading, error };
}
