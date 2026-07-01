import { useState } from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import { House, Menu, ShoppingCart, X } from 'lucide-react';
import { useCart } from '@/hooks/useCart';
import { usePageMeta } from '@/hooks/usePageMeta';
import { cn } from '@/lib/utils';

const NAV = [
  { to: '/catalogo', label: 'Catálogo' },
  { to: '/novedades', label: 'Novedades' },
  { to: '/nosotros', label: 'Nosotros' },
];

/** Layout de la tienda pública: nav (con menú mobile) + contenido + footer. */
export function ShopLayout() {
  const [open, setOpen] = useState(false);
  const { count } = useCart();

  usePageMeta({ robots: 'index,follow', title: 'Tecnologia Importada' });

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <header className="mx-auto w-full max-w-container shrink-0 px-4 pt-5">
        <nav className="rounded-lg border border-line bg-surface px-4 py-3 shadow-ti sm:px-5">
          <div className="flex items-center gap-4">
            <Link to="/" className="flex items-center gap-2 text-lg font-extrabold tracking-tight">
              <span className="h-2.5 w-2.5 rounded-full bg-accent" aria-hidden="true" />
              <span className="sm:hidden">TI</span>
              <span className="hidden sm:inline">Tecnología Importada</span>
            </Link>

            {/* Links de escritorio */}
            <div className="ml-2 hidden gap-2 text-sm font-medium text-text-soft md:flex">
              {NAV.map((n) => (
                <NavLink
                  key={n.to}
                  to={n.to}
                  className={({ isActive }) =>
                    cn(
                      'rounded-pill px-3 py-1.5 transition-colors',
                      isActive
                        ? 'bg-accent text-on-accent'
                        : 'text-text-soft hover:bg-surface-2 hover:text-text',
                    )
                  }
                >
                  {n.label}
                </NavLink>
              ))}
            </div>

            <div className="ml-auto flex items-center gap-2.5">
              <NavLink
                to="/"
                end
                aria-label="Inicio"
                className={({ isActive }) =>
                  cn(
                    'flex h-11 w-11 items-center justify-center rounded-pill border transition-colors',
                    isActive
                      ? 'border-transparent bg-accent text-on-accent'
                      : 'border-line bg-surface-2 text-text',
                  )
                }
              >
                <House size={18} aria-hidden="true" />
              </NavLink>
              <NavLink
                to="/carrito"
                aria-label={`Carrito (${count})`}
                className={({ isActive }) =>
                  cn(
                    'relative flex h-11 w-11 items-center justify-center rounded-pill border transition-colors',
                    isActive
                      ? 'border-transparent bg-accent text-on-accent'
                      : 'border-line bg-surface-2 text-text',
                  )
                }
              >
                <ShoppingCart size={18} aria-hidden="true" />
                {count > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-accent px-1 text-xs font-bold text-on-accent">
                    {count}
                  </span>
                )}
              </NavLink>
              {/* Botón menú (solo mobile) */}
              <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                aria-label={open ? 'Cerrar menú' : 'Abrir menú'}
                className="flex h-11 w-11 items-center justify-center rounded-pill border border-line bg-surface-2 text-text md:hidden"
              >
                {open ? <X size={18} aria-hidden="true" /> : <Menu size={18} aria-hidden="true" />}
              </button>
            </div>
          </div>

          {/* Panel de menú mobile */}
          {open && (
            <div className="mt-3 flex flex-col gap-1 border-t border-line pt-3 md:hidden">
              {NAV.map((n) => (
                <NavLink
                  key={n.to}
                  to={n.to}
                  onClick={() => setOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      'rounded-md px-3 py-2.5 text-[15px] font-medium transition-colors',
                      isActive ? 'bg-accent text-on-accent' : 'text-text-soft hover:bg-surface-2',
                    )
                  }
                >
                  {n.label}
                </NavLink>
              ))}
            </div>
          )}
        </nav>
      </header>

      <div className="flex-1 overflow-y-auto">
        <main className="mx-auto w-full max-w-container px-4 py-8">
          <Outlet />
        </main>
        <footer className="mx-auto w-full max-w-container px-4 pb-10 text-sm text-text-soft">
          © {new Date().getFullYear()} Tecnología Importada 
        </footer>
      </div>
    </div>
  );
}
