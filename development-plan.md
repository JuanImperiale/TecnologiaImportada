# Plan de desarrollo — Tecnología Importada

Revisión previa + plan por fases. Cada fase termina en un **entregable que probás en tu localhost** y avanzamos solo con tu confirmación.
Documentos base: `architecture.md`, `routes.md`, `admin-modules.md`, `design-system.md`, `theme-tokens.css`, `firebase-setup.md`.

---

## A. Veredicto de compatibilidad

Revisada toda la documentación: **todo lo definido es realizable con la arquitectura frontend + Firebase, sin servidor propio.** No hay funcionalidad que obligue a rediseñar la arquitectura. Hay puntos que requieren una técnica concreta (no un cambio de enfoque):

| Funcionalidad | Cómo se resuelve sin servidor | Cuidado |
|---|---|---|
| Nº de venta correlativo | `runTransaction` sobre `counters/ventas` | Siempre vía transacción para no duplicar |
| Descuento de stock al vender | `runTransaction`: lee stock, valida, escribe venta + movimiento + nuevo stock | Atómico; valida stock suficiente antes |
| Anular venta | Transacción que reintegra stock y marca `anulada` | Igual, atómico |
| Balance mensual | Query de `ventas` del mes + reduce en el cliente | Necesita índices compuestos (ver C) |
| Comprobante / reportes PDF | `@react-pdf/renderer` en el cliente | — |
| Export Excel/CSV | SheetJS en el cliente | — |
| Imágenes de producto | Storage SDK + compresión en el cliente antes de subir | Sin Function; opcional extensión Resize |
| Pedido anónimo | Reglas permiten `create`; App Check | App Check con debug token en localhost |
| WhatsApp | Link `wa.me` en el cliente | — |
| Gastos recurrentes | Acción "clonar gastos del mes anterior" (no cron) | No usamos tareas programadas |
| Acceso del equipo | Login Email/Password; **sin roles** | Todo usuario autenticado accede a todo |

**No hay roles ni componente de servidor para acceso.** El equipo se gestiona desde la consola de Firebase (Authentication → Usuarios): cualquier usuario habilitado entra al panel completo. Todo es 100% frontend + Firebase.

---

## B. Convenciones transversales (en TODAS las fases)

Estas reglas aplican a cada módulo desde el primer commit:

1. **Patrón en capas estricto:** `components/` (solo UI) → `hooks/` (estado, orquestación) → `services/` (reglas de negocio, único que habla con Firebase). Un componente nunca importa Firestore directo.
2. **Componentes reutilizables:** kit base en `components/ui/` (Button, Input, Select, Card, Modal, Badge, Table, Toast, Skeleton, EmptyState). Los módulos los componen, no reinventan.
3. **Cero datos hardcodeados:** todo sale de Firestore. Para probar el catálogo antes de tener la UI de inventario, el orden de fases pone **Inventario antes que Catálogo**, así cargás datos reales desde el panel.
4. **Diseño respetado:** solo se usan los tokens de `theme-tokens.css` (vía Tailwind). Prohibido `#000`/`#fff` sueltos. Claro/oscuro/sistema funcionando desde el día 1.
5. **Clean code:** TypeScript estricto, nombres claros, funciones chicas, sin duplicación, ESLint + Prettier. Tipos/modelos centralizados (`models/`) + validación con **Zod** (los schemas espejan las reglas de Firestore).
6. **Control de errores y excepciones:** cada `service` envuelve sus llamadas y devuelve un resultado tipado (`{ ok, data | error }`); nada de promesas sin `catch`. `ErrorBoundary` global en la UI. Estados de **loading / vacío / error** en cada vista.
7. **Notificaciones (toasts):** éxito, error y **advertencias por reglas de negocio** (ej. "stock insuficiente", "stock bajo", "estás regalando $X en esta venta"). Una sola librería de toasts (`sonner`).
8. **Responsive 100%:** mobile-first, breakpoints definidos; se prueba en mobile y desktop en cada gate.
9. **Accesibilidad básica:** foco visible, `aria-label` en botones de ícono, contraste AA.

---

## C. Stack técnico (a confirmar)

| Necesidad | Elección recomendada |
|---|---|
| Base | Vite + React + **TypeScript** |
| Estilos | Tailwind CSS + **shadcn/ui** (con nuestros tokens) |
| Ruteo | React Router v6 (layouts + lazy admin) |
| Datos/estado | **Hooks propios** sobre Firestore (`onSnapshot` para listas en vivo como Notificaciones; `getDocs` para el resto) + `services`. Sin Redux. (React Query queda como opción futura.) |
| Formularios | React Hook Form + **Zod** |
| Notificaciones | sonner (toasts) |
| PDF | @react-pdf/renderer |
| Excel/CSV | SheetJS (xlsx) |
| Íconos | lucide-react |
| Fechas/moneda | `Intl.NumberFormat` (ARS) + dayjs |

Notas:
- **Fuente:** Helvetica Neue no tiene licencia web libre; usamos **Inter** como fuente real (con Helvetica Neue como fallback del sistema). El diseño ya lo contempla.
- **Logo:** falta el SVG vectorial del logo para nav y favicon (hoy tenemos los PNG).

### Puntos técnicos a preparar
- **Índices compuestos de Firestore** (se crean al correr las queries; los dejamos en `firestore.indexes.json`): `products` por `negocio`+`activo`; `ventas` por `estado`+`creado` y por `negocio`+`creado`; `pedidos` por `estado`+`creado`.
- **`counters/`** para numeración correlativa de ventas.
- **Accesos:** sin roles; el alta/baja de usuarios del equipo se hace en la consola de Firebase Auth.
- **App Check en dev:** registrar debug token de localhost.
- **Auth:** habilitar Email/Password y agregar `localhost` a dominios autorizados.

---

## D. Decisiones pendientes (con default propuesto)

No bloquean el arranque (afectan recién la fase de Ventas). Propongo estos defaults y los confirmás al llegar a esa fase:

1. **Recargo por tarjeta:** default = **porcentaje configurable** en `/adm/configuracion` (un solo %). Cuotas, más adelante.
2. **Devoluciones:** default = **solo anulación total** de la venta (reintegra todo el stock). Devolución parcial, fase futura.
3. **Costo de envío:** default = **manual por venta** (lo escribís al registrar). Zonas con precio fijo, más adelante.
4. **Reporte de facturación:** default = **ambos** (resumen por venta + export mensual).

---

## E. Plan por fases

Cada fila "Entregable" es lo que vas a poder abrir y probar en `localhost`. Avanzamos a la siguiente fase solo con tu **OK**.

### Fase 0 — Fundación
Scaffolding: Vite+React+TS, ESLint/Prettier, Tailwind+shadcn, `theme-tokens.css`, fuente Inter, estructura de carpetas, React Router con `ShopLayout`/`AdminLayout` (admin lazy), tema claro/oscuro/sistema + `useTheme`, `lib/firebase.ts` desde env, kit UI base, utilidades (moneda/fecha), wrapper de errores + `useAsync`, modelos TS + schemas Zod.
**Entregable localhost:** la app levanta, el toggle de tema funciona, las rutas muestran sus layouts vacíos, conecta con Firebase. Sin datos aún.

### Fase 1 — Auth admin + guard de sesión ✅ (hecha)
`authService` (login/logout, observar sesión), `AuthProvider` + `useAuth`, página `/adm` (login real con Zod), `ProtectedRoute` (requiere sesión, **sin roles**), sidebar con todos los módulos, topbar con email + logout.
**Entregable:** entrás a `/adm`, login real, el guard protege las rutas, logout. Cualquier usuario habilitado en Firebase Auth accede a todo.

### Fase 2 — Inventario (Productos / Accesorios) + Categorías
`productService` (CRUD, soft-delete, queries por unidad/activo), `categoryService`, subida de imágenes a Storage (con compresión), variantes, stock + `stockMinimo` + alerta de stock bajo, `movimientosStock` (ingreso/ajuste), hooks `useProducts`/`useCategories`, UI con pestañas Productos/Accesorios, `ProductForm`, búsqueda y filtros. Reglas + índices.
**Entregable:** das de alta/editás/eliminás productos y categorías con imágenes; queda todo en Firestore (datos reales para las próximas fases).

### Fase 3 — Catálogo público
Home (hero, categorías, destacados + banners), `/catalogo` (filtros, orden, paginación), `/categoria/:slug`, `/producto/:slug` (galería, variantes, specs), `/buscar`. Todo lee de Firestore. Responsive. SEO básico por slug.
**Entregable:** la tienda pública muestra los productos reales cargados en la Fase 2, bien en mobile y desktop.

### Fase 4 — Carrito + confirmación
`cartService` (localStorage, alta/baja/cantidades, totales) + `useCart` con sync entre pestañas (evento `storage`), `CartDrawer` + `/carrito`, `/carrito/confirmar` (form nombre+celular), `orderService.crearPedido` (valida, escribe `pedidos`, arma y abre `wa.me`), `/pedido/enviado` (limpia carrito). Reglas de `pedidos` + App Check.
**Entregable:** armás un carrito, confirmás, se crea el pedido en Firestore y se abre WhatsApp con el detalle.

### Fase 5 — Notificaciones (admin)
`pedidoService` (lista en vivo con `onSnapshot`, marcar visto/atendido, descartar), `usePedidos`, **badge de pendientes** en el sidebar, `/adm/notificaciones` (lista + filtros), detalle, "Responder por WhatsApp", "Convertir en venta" (precarga).
**Entregable:** ves las consultas en tiempo real, cambiás estados, el badge cuenta las no atendidas.

### Fase 6 — Ventas (núcleo)
`saleService.crearVenta` con `runTransaction` (lee stock → valida → asigna nº correlativo → escribe venta → descuenta stock → registra movimiento), líneas **venta/bonificación**, mezcla de unidades, descuento, **envío** (retiro/envío + costo), medio de pago + recargo tarjeta, snapshot de costo, cálculo de `costoTotal`/`costoBonificaciones`/atribución. **Comprobante PDF** (bonificación $0). Listado con desglose + filtros + **anular** (transacción que reintegra stock). **Reporte de facturación manual** (por venta + export mensual) y registro de nº Factura C / CAE.
**Entregable:** registrás una venta completa con stock atómico, generás el PDF, anulás, y sacás el reporte para facturar.

### Fase 7 — Gastos + Balance (solo admin)
`gastoService` (CRUD, recurrente, clonar mes anterior), `/adm/gastos`, `balanceService` (agrega ventas del mes por unidad: ingresos, COGS, margen, bonificaciones, envío; resta gastos; ganancia neta; prorrateo opcional), `/adm/balance` (tarjetas, comparativa Productos vs Accesorios, KPI bonificaciones, selector de mes, comparación con mes anterior), export Excel/CSV.
**Entregable:** el balance refleja las ventas y gastos reales y se exporta.

### Fase 8 — Soporte + Dashboard
Importaciones (lote → ingresa stock y fija costo), Contenido/banners del home, Contactos (derivados), Configuración (datos del negocio, WhatsApp, stock mínimo, fiscales, medios de pago, envíos), Dashboard con KPIs (ventas día/mes, ticket promedio, top productos, stock bajo, consultas pendientes), log de auditoría. (Sin módulo de usuarios/roles: el acceso se gestiona en Firebase Auth.)
**Entregable:** panel completo y operativo.

### Fase 9 — QA, responsive, seguridad y despliegue
Repaso responsive en todos los breakpoints, estados de error/vacío/carga, validaciones, reglas Firestore/Storage finales + App Check en producción, índices, **pruebas funcionales una por una**, build y `firebase deploy`. Restringir la API key por dominio; configurar backups.
**Entregable:** la app desplegada en tu hosting de Firebase.

---

## F. Cómo trabajamos cada entrega

1. Yo desarrollo la fase completa (con las convenciones de la sección B).
2. Te dejo instrucciones para correrla en `localhost` (`npm install` / `npm run dev`).
3. Probás la funcionalidad de esa fase.
4. Me confirmás (OK o ajustes). Recién ahí arranco la fase siguiente.
5. El despliegue a Firebase Hosting es **al final** (Fase 9), después de probar todo.

> Nota: durante el desarrollo trabajamos contra el proyecto Firebase real (`tecnologiaimportada`). Ideal tener un proyecto `-dev` aparte para no mezclar datos de prueba con producción; si querés, lo contemplamos en la Fase 0.
