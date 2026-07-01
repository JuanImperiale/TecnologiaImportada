import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import {
  Bell,
  Package,
  Receipt,
  PieChart,
  Wallet,
  Tag,
  Truck,
  Contact,
  Image,
  Settings,
  LayoutDashboard,
  Menu,
  X,
  LogOut,
  type LucideIcon,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { usePedidos } from '@/hooks/usePedidos';
import { usePageMeta } from '@/hooks/usePageMeta';
import { cn } from '@/lib/utils';

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
}

// Grupos del menú lateral. No hay roles: todos los módulos son visibles para
// cualquier usuario autenticado.
const GROUPS: { title: string; items: NavItem[] }[] = [
  {
    title: 'Operación',
    items: [
      { to: '/adm/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { to: '/adm/notificaciones', label: 'Notificaciones', icon: Bell },
      { to: '/adm/ventas', label: 'Ventas', icon: Receipt },
      { to: '/adm/contactos', label: 'Contactos', icon: Contact },
    ],
  },
  {
    title: 'Catálogo y stock',
    items: [
      { to: '/adm/inventario', label: 'Inventario', icon: Package },
      { to: '/adm/categorias', label: 'Categorías', icon: Tag },
      { to: '/adm/importaciones', label: 'Importaciones', icon: Truck },
      { to: '/adm/novedades', label: 'Novedades', icon: Image },
      { to: '/adm/contenido', label: 'Contenido', icon: Image },
    ],
  },
  {
    title: 'Finanzas',
    items: [
      { to: '/adm/balance', label: 'Balance', icon: PieChart },
      { to: '/adm/gastos', label: 'Gastos', icon: Wallet },
    ],
  },
  {
    title: 'Sistema',
    items: [{ to: '/adm/configuracion', label: 'Configuración', icon: Settings }],
  },
];

function SidebarContent({
  onNavigate,
  pendientes,
}: {
  onNavigate?: () => void;
  pendientes: number;
}) {
  return (
    <>
      <div className="mb-6 flex items-center gap-2 px-2 text-lg font-extrabold tracking-tight">
        <span className="h-2.5 w-2.5 rounded-full bg-accent" aria-hidden="true" />
        TI · Admin
      </div>
      <nav className="flex flex-col gap-5">
        {GROUPS.map((group) => (
          <div key={group.title}>
            <p className="px-2 pb-1.5 text-xs font-bold uppercase tracking-wider text-text-faint">
              {group.title}
            </p>
            <div className="flex flex-col gap-0.5">
              {group.items.map(({ to, label, icon: Icon }) => {
                const showBadge = to === '/adm/notificaciones' && pendientes > 0;
                return (
                  <NavLink
                    key={to}
                    to={to}
                    onClick={onNavigate}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition-colors',
                        isActive
                          ? 'bg-accent text-on-accent'
                          : 'text-text-soft hover:bg-surface-2 hover:text-text',
                      )
                    }
                  >
                    <Icon size={17} aria-hidden="true" />
                    <span className="flex-1">{label}</span>
                    {showBadge && (
                      <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-danger px-1 text-xs font-bold text-white">
                        {pendientes}
                      </span>
                    )}
                  </NavLink>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
    </>
  );
}

/** Layout del panel admin: sidebar (drawer en mobile) + topbar + contenido. */
export function AdminLayout() {
  const [drawer, setDrawer] = useState(false);
  const { user, logout } = useAuth();
  const { pendientes } = usePedidos();

  usePageMeta({ robots: 'noindex,nofollow', title: 'Admin | Tecnologia Importada' });

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar fijo en escritorio (con su propio scroll si hace falta) */}
      <aside className="hidden w-64 shrink-0 overflow-y-auto border-r border-line bg-surface p-4 md:block">
        <SidebarContent pendientes={pendientes} />
      </aside>

      {/* Drawer en mobile */}
      {drawer && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/45"
            onClick={() => setDrawer(false)}
            aria-hidden="true"
          />
          <aside className="absolute left-0 top-0 h-full w-64 overflow-y-auto border-r border-line bg-surface p-4">
            <button
              type="button"
              onClick={() => setDrawer(false)}
              aria-label="Cerrar menú"
              className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-md text-text-soft hover:bg-surface-2"
            >
              <X size={18} aria-hidden="true" />
            </button>
            <SidebarContent pendientes={pendientes} onNavigate={() => setDrawer(false)} />
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex shrink-0 items-center gap-3 border-b border-line bg-surface px-4 py-3 sm:px-5">
          <button
            type="button"
            onClick={() => setDrawer(true)}
            aria-label="Abrir menú"
            className="flex h-10 w-10 items-center justify-center rounded-md border border-line bg-surface-2 text-text md:hidden"
          >
            <Menu size={18} aria-hidden="true" />
          </button>
          <span className="text-sm font-medium text-text-soft md:hidden">TI · Admin</span>
          <div className="ml-auto flex items-center gap-3">
            <div className="hidden items-center gap-2 border-l border-line pl-3 sm:flex">
              <span className="max-w-[180px] truncate text-sm text-text-soft" title={user?.email ?? ''}>
                {user?.email}
              </span>
            </div>
            <button
              type="button"
              onClick={() => void logout()}
              aria-label="Cerrar sesión"
              title="Cerrar sesión"
              className="flex h-10 w-10 items-center justify-center rounded-md border border-line bg-surface-2 text-text hover:border-line-strong"
            >
              <LogOut size={17} aria-hidden="true" />
            </button>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-5 md:p-7">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
