import { useEffect, useMemo, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { Search } from 'lucide-react';
import { useCatalog } from '@/hooks/useCatalog';
import { ProductCard } from '@/components/shop/ProductCard';
import { Input } from '@/components/ui/Input';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { cn, slugify } from '@/lib/utils';
import type { Negocio } from '@/models';

type Unidad = Negocio | 'todos';

function parseUnidad(value: string | null): Unidad {
  return value === 'productos' || value === 'accesorios' || value === 'todos'
    ? value
    : 'todos';
}

export function CatalogoPage() {
  const { slug } = useParams();
  const [params] = useSearchParams();
  const { all, categorias, loading, error } = useCatalog();

  const [search, setSearch] = useState(params.get('q') ?? '');
  const [unidad, setUnidad] = useState<Unidad>(() => parseUnidad(params.get('unidad')));
  // State holds the category document ID (empty = all)
  const [categoriaId, setCategoriaId] = useState(params.get('categoriaId') ?? '');
  const [visibleCount, setVisibleCount] = useState(16);

  // Categories visible in the current unit (only those with products)
  const categoriasUnidad = useMemo(() => {
    const fuente = unidad === 'todos' ? all : all.filter((p) => p.negocio === unidad);
    const usedIds = new Set(fuente.map((p) => p.categoriaId).filter(Boolean));
    return categorias.filter((c) => usedIds.has(c.id));
  }, [all, categorias, unidad]);

  // /categoria/:slug → resolve category ID from slug
  useEffect(() => {
    if (slug && categorias.length) {
      const match = categorias.find((c) => slugify(c.nombre) === slug);
      setCategoriaId(match?.id ?? '');
    }
  }, [slug, categorias]);

  const cambiarUnidad = (u: Unidad) => {
    setUnidad(u);
    setCategoriaId('');
  };

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return all.filter(
      (p) =>
        (unidad === 'todos' || p.negocio === unidad) &&
        (!categoriaId || p.categoriaId === categoriaId) &&
        (!term ||
          p.nombre.toLowerCase().includes(term) ||
          (p.descripcion ?? '').toLowerCase().includes(term) ||
          (p.categoria ?? '').toLowerCase().includes(term)),
    );
  }, [all, unidad, categoriaId, search]);

  useEffect(() => {
    setVisibleCount(16);
  }, [search, unidad, categoriaId]);

  const visibleProducts = useMemo(
    () => filtered.slice(0, visibleCount),
    [filtered, visibleCount],
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col items-center gap-3 text-center">
        {/* Buscador */}
        <div className="relative mt-2 w-full max-w-md">
          <Search
            size={17}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-soft"
            aria-hidden="true"
          />
          <Input
            placeholder="Buscar productos…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* División principal: Todos / Productos / Accesorios */}
        <div className="inline-flex w-full max-w-md rounded-pill border border-line bg-surface-2 p-1 sm:w-auto">
          {(['todos', 'productos', 'accesorios'] as Unidad[]).map((u) => (
            <button
              key={u}
              type="button"
              onClick={() => cambiarUnidad(u)}
              className={cn(
                'flex-1 rounded-pill px-5 py-2 text-sm font-bold capitalize transition-colors sm:flex-none',
                unidad === u ? 'bg-accent text-on-accent' : 'text-text-soft hover:text-text',
              )}
            >
              {u}
            </button>
          ))}
        </div>
      </div>

      {/* Categorías de la unidad elegida */}
      {categoriasUnidad.length > 0 && (
        <div className="-mx-4 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
          <div className="flex min-w-max gap-2 sm:min-w-0 sm:flex-wrap sm:justify-center">
            <button
              type="button"
              onClick={() => setCategoriaId('')}
              className={cn(
                'whitespace-nowrap rounded-pill border px-4 py-1.5 text-sm font-medium transition-colors',
                !categoriaId
                  ? 'border-transparent bg-accent text-on-accent'
                  : 'border-line bg-surface-2 text-text-soft hover:text-text',
              )}
            >
              Todas
            </button>
            {categoriasUnidad.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setCategoriaId(c.id)}
                className={cn(
                  'whitespace-nowrap rounded-pill border px-4 py-1.5 text-sm font-medium transition-colors',
                  categoriaId === c.id
                    ? 'border-transparent bg-accent text-on-accent'
                    : 'border-line bg-surface-2 text-text-soft hover:text-text',
                )}
              >
                {c.nombre}
              </button>
            ))}
          </div>
        </div>
      )}

      {loading ? (
        <Spinner />
      ) : error ? (
        <EmptyState title="Error" description={error} />
      ) : filtered.length === 0 ? (
        <EmptyState
          title="Sin resultados"
          description="No encontramos productos con esos filtros."
        />
      ) : (
        <div className="flex flex-col gap-5">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {visibleProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
          {visibleCount < filtered.length && (
            <div className="flex justify-center">
              <button
                type="button"
                onClick={() => setVisibleCount((n) => n + 16)}
                className="rounded-pill border border-line bg-surface-2 px-5 py-2 text-sm font-bold text-text-soft transition-colors hover:text-text"
              >
                Cargar más productos
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
