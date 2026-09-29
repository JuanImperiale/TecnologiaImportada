import { useEffect, useMemo, useState } from 'react';
import { productService } from '@/services/productService';
import { categoryService } from '@/services/categoryService';
import { matchesSearch } from '@/lib/utils';
import type { Producto, Categoria, Negocio } from '@/models';

interface CatalogFilters {
  negocio?: Negocio | 'todos';
  categoriaId?: string;
  search?: string;
  loadProducts?: boolean;
}

/**
 * Catálogo público: suscribe a los productos activos (ambas unidades) y aplica
 * filtros en el cliente (unidad, categoría, búsqueda).
 */
export function useCatalog(filters: CatalogFilters = {}) {
  const loadProducts = filters.loadProducts ?? true;
  const [all, setAll] = useState<Producto[]>(() => productService.getCachedActive());
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(loadProducts && all.length === 0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = categoryService.subscribeAll(
      (cats) => setCategorias(cats),
      () => { /* categorías no bloquean la carga */ },
    );
    return unsubscribe;
  }, []);

  useEffect(() => {
    setError(null);
    if (!loadProducts) {
      setLoading(false);
      return;
    }
    setLoading(true);
    return productService.subscribeActive(
      (items) => {
        setAll(items);
        setLoading(false);
        setError(null);
      },
      (msg) => {
        setError(msg);
        setLoading(false);
      },
    );
  }, [loadProducts]);

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
    const term = filters.search?.trim();
    if (term) {
      list = list.filter((p) =>
        matchesSearch(term, p.nombre, p.descripcion, catMap.get(p.categoriaId) ?? p.categoria),
      );
    }
    return list;
  }, [all, filters.negocio, filters.categoriaId, filters.search, catMap]);

  const featured = useMemo(() => all.filter((p) => p.destacado), [all]);

  return { products, all, featured, categorias, catMap, loading, error };
}
