import { Suspense, lazy } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { ShopLayout } from '@/components/layout/ShopLayout';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { ProtectedRoute } from '@/components/layout/ProtectedRoute';
import { Spinner } from '@/components/ui/Spinner';
import { RouteErrorBoundary } from '@/routes/RouteErrorBoundary';
import { NotFound } from '@/routes/NotFound';

const HomePage = lazy(() => import('@/routes/shop/HomePage').then((m) => ({ default: m.HomePage })));
const CatalogoPage = lazy(() => import('@/routes/shop/CatalogoPage').then((m) => ({ default: m.CatalogoPage })));
const ProductDetailPage = lazy(() => import('@/routes/shop/ProductDetailPage').then((m) => ({ default: m.ProductDetailPage })));
const CarritoPage = lazy(() => import('@/routes/shop/CarritoPage').then((m) => ({ default: m.CarritoPage })));
const ConfirmarPedidoPage = lazy(() => import('@/routes/shop/ConfirmarPedidoPage').then((m) => ({ default: m.ConfirmarPedidoPage })));
const PedidoEnviadoPage = lazy(() => import('@/routes/shop/PedidoEnviadoPage').then((m) => ({ default: m.PedidoEnviadoPage })));
const NosotrosPage = lazy(() => import('@/routes/shop/InfoPages').then((m) => ({ default: m.NosotrosPage })));
const ContactoPage = lazy(() => import('@/routes/shop/InfoPages').then((m) => ({ default: m.ContactoPage })));
const EnviosPage = lazy(() => import('@/routes/shop/InfoPages').then((m) => ({ default: m.EnviosPage })));
const FaqPage = lazy(() => import('@/routes/shop/InfoPages').then((m) => ({ default: m.FaqPage })));
const LegalesPage = lazy(() => import('@/routes/shop/InfoPages').then((m) => ({ default: m.LegalesPage })));
const NovedadesPage = lazy(() => import('@/routes/shop/NovedadesPage').then((m) => ({ default: m.NovedadesPage })));
const LoginPage = lazy(() => import('@/routes/admin/LoginPage').then((m) => ({ default: m.LoginPage })));
const DashboardPage = lazy(() => import('@/routes/admin/DashboardPage').then((m) => ({ default: m.DashboardPage })));
const NotificacionesPage = lazy(() => import('@/routes/admin/NotificacionesPage').then((m) => ({ default: m.NotificacionesPage })));
const InventarioPage = lazy(() => import('@/routes/admin/InventarioPage').then((m) => ({ default: m.InventarioPage })));
const ProductFormPage = lazy(() => import('@/routes/admin/ProductFormPage').then((m) => ({ default: m.ProductFormPage })));
const CategoriasPage = lazy(() => import('@/routes/admin/CategoriasPage').then((m) => ({ default: m.CategoriasPage })));
const VentasPage = lazy(() => import('@/routes/admin/VentasPage').then((m) => ({ default: m.VentasPage })));
const NuevaVentaPage = lazy(() => import('@/routes/admin/NuevaVentaPage').then((m) => ({ default: m.NuevaVentaPage })));
const VentaDetailPage = lazy(() => import('@/routes/admin/VentaDetailPage').then((m) => ({ default: m.VentaDetailPage })));
const BalancePage = lazy(() => import('@/routes/admin/BalancePage').then((m) => ({ default: m.BalancePage })));
const GastosPage = lazy(() => import('@/routes/admin/GastosPage').then((m) => ({ default: m.GastosPage })));
const ImportacionesPage = lazy(() => import('@/routes/admin/ImportacionesPage').then((m) => ({ default: m.ImportacionesPage })));
const ContactosPage = lazy(() => import('@/routes/admin/ContactosPage').then((m) => ({ default: m.ContactosPage })));
const ContenidoPage = lazy(() => import('@/routes/admin/ContenidoPage').then((m) => ({ default: m.ContenidoPage })));
const ConfiguracionPage = lazy(() => import('@/routes/admin/ConfiguracionPage').then((m) => ({ default: m.ConfiguracionPage })));
const NovedadesPageAdmin = lazy(() => import('@/routes/admin/NovedadesPage').then((m) => ({ default: m.NovedadesPageAdmin })));

function page(element: React.ReactNode) {
  return <Suspense fallback={<Spinner className="min-h-[40vh]" />}>{element}</Suspense>;
}

export const router = createBrowserRouter([
  // ───────── Zona pública ─────────
  {
    element: <ShopLayout />,
    errorElement: <RouteErrorBoundary />,
    children: [
      { path: '/', element: page(<HomePage />) },
      { path: '/catalogo', element: page(<CatalogoPage />) },
      { path: '/categoria/:slug', element: page(<CatalogoPage />) },
      { path: '/producto/:id', element: page(<ProductDetailPage />) },
      { path: '/buscar', element: page(<CatalogoPage />) },
      { path: '/carrito', element: page(<CarritoPage />) },
      { path: '/carrito/confirmar', element: page(<ConfirmarPedidoPage />) },
      { path: '/pedido/enviado', element: page(<PedidoEnviadoPage />) },
      { path: '/novedades', element: page(<NovedadesPage />) },
      { path: '/nosotros', element: page(<NosotrosPage />) },
      { path: '/contacto', element: page(<ContactoPage />) },
      { path: '/envios', element: page(<EnviosPage />) },
      { path: '/faq', element: page(<FaqPage />) },
      { path: '/legales', element: page(<LegalesPage />) },
    ],
  },

  // ───────── Zona admin ─────────
  // /adm es la puerta (login, público). Todo lo demás pasa por ProtectedRoute.
  { path: '/adm', element: page(<LoginPage />), errorElement: <RouteErrorBoundary /> },
  { path: '/admin', element: <Navigate to="/adm" replace /> },
  {
    path: '/adm',
    element: <ProtectedRoute />, // requiere sesión (cualquier usuario habilitado)
    errorElement: <RouteErrorBoundary />,
    children: [
      {
        element: <AdminLayout />,
        errorElement: <RouteErrorBoundary />,
        children: [
          { path: 'dashboard', element: page(<DashboardPage />) },
          { path: 'notificaciones', element: page(<NotificacionesPage />) },
          { path: 'inventario', element: page(<InventarioPage />) },
          { path: 'inventario/nuevo', element: page(<ProductFormPage />) },
          { path: 'inventario/:id', element: page(<ProductFormPage />) },
          { path: 'categorias', element: page(<CategoriasPage />) },
          { path: 'ventas', element: page(<VentasPage />) },
          { path: 'ventas/nueva', element: page(<NuevaVentaPage />) },
          { path: 'ventas/:id', element: page(<VentaDetailPage />) },
          { path: 'balance', element: page(<BalancePage />) },
          { path: 'gastos', element: page(<GastosPage />) },
          { path: 'importaciones', element: page(<ImportacionesPage />) },
          { path: 'contactos', element: page(<ContactosPage />) },
          { path: 'novedades', element: page(<NovedadesPageAdmin />) },
          { path: 'contenido', element: page(<ContenidoPage />) },
          { path: 'configuracion', element: page(<ConfiguracionPage />) },
        ],
      },
    ],
  },

  { path: '*', element: <NotFound />, errorElement: <RouteErrorBoundary /> },
]);
