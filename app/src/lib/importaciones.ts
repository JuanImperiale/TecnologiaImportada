import { matchesSearch } from '@/lib/utils';
import type { Producto } from '@/models';

export function buscarProductosImportacion(
  productos: Producto[],
  busqueda: string,
  idsAgregados: readonly string[],
  categorias: ReadonlyMap<string, string>,
): Producto[] {
  const termino = busqueda.trim();
  if (!termino) return [];
  const agregados = new Set(idsAgregados);
  return productos.filter((producto) =>
    !agregados.has(producto.id) &&
    matchesSearch(termino, producto.nombre, producto.sku, categorias.get(producto.categoriaId) ?? producto.categoria),
  );
}