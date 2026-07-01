# Árbol de URLs y vistas — Tecnología Importada

Dos zonas en la misma app React: **pública** bajo `/` y **administración** bajo `/adm`.
Documentos relacionados: `architecture.md`, `design-system.md`.

Niveles de acceso:
- **Abierto** — cualquiera, sin cuenta. Toda la zona pública es abierta: **no hay registro ni login de clientes**.
- **Autenticado** — cualquier usuario habilitado en Firebase Auth. **No hay roles**: todos los del equipo acceden a todo el panel.

> La separación por URL (`/` vs `/adm`) ordena la app, pero **no es la barrera de seguridad**. La protección real es: guard de sesión + Firestore Security Rules. El control de quién entra es la lista de usuarios de Firebase Auth. `/adm` lleva `noindex` para no aparecer en buscadores.

Modelo del lado público (sin cuentas):
- El **carrito vive en `localStorage`** (compartido entre pestañas y persistente; se sincroniza con el evento `storage`).
- El cliente navega y arma el carrito sin identificarse.
- Recién al **confirmar** pedimos **nombre + celular**. Eso genera un pedido/consulta que llega al admin por **panel (`/adm/notificaciones`) + WhatsApp**.
- No hay pago online por ahora; la venta se coordina por WhatsApp. (Se puede sumar pago online más adelante sin romper esto.)

---

## 1. Zona pública — `/`

| URL | Vista | Acceso | Módulo |
|---|---|---|---|
| `/` | Home: hero, categorías, destacados | Abierto | Catálogo |
| `/catalogo` | Listado con filtros, orden, paginación | Abierto | Catálogo |
| `/categoria/:slug` | Catálogo filtrado por categoría | Abierto | Catálogo |
| `/producto/:id` | Detalle: galería, precio, specs, agregar al carrito. Usa el **ID único** del producto (no el nombre), así dos productos pueden llamarse igual sin conflicto | Abierto | Catálogo |
| `/buscar?q=` | Resultados de búsqueda | Abierto | Catálogo |
| `/carrito` | Carrito (localStorage), editar cantidades, botón "Confirmar pedido" | Abierto | Carrito |
| `/carrito/confirmar` | Form mínimo: nombre + celular (sin registro). Al enviar: crea pedido + abre WhatsApp | Abierto | Confirmación |
| `/pedido/enviado` | Confirmación: "Te contactamos por WhatsApp". Limpia el carrito | Abierto | Confirmación |
| `/nosotros` | Quiénes somos | Abierto | Contenido |
| `/contacto` | Formulario / WhatsApp | Abierto | Contenido |
| `/envios` | Envíos y devoluciones | Abierto | Contenido |
| `/faq` | Preguntas frecuentes | Abierto | Contenido |
| `/legales` | Términos y privacidad | Abierto | Contenido |
| `*` | 404 | Abierto | — |

Notas: `/carrito/confirmar` puede ser una página o un modal sobre el carrito. No se pide email ni contraseña — solo nombre y celular. Favoritos, si se quieren, también pueden vivir en `localStorage` sin cuenta.

## 2. Zona admin — `/adm`

| URL | Vista | Acceso | Módulo |
|---|---|---|---|
| `/adm` | **Login admin** (puerta). Si ya hay sesión válida → redirige a `/adm/dashboard` | Abierto (form) | Auth |
| `/adm/dashboard` | Métricas: ventas, pedidos, stock bajo, top productos | Autenticado | Dashboard |
| `/adm/notificaciones` | Bandeja de consultas de carrito; estados nuevo/visto/atendido; badge de pendientes | Autenticado | Notificaciones |
| `/adm/notificaciones/:id` | Detalle: cliente, productos; "Responder por WhatsApp"; "Convertir en venta" | Autenticado | Notificaciones |
| `/adm/inventario` | Inventario con pestañas **Productos** / **Accesorios**; stock, alta, editar, soft-delete | Autenticado | Inventario |
| `/adm/inventario/nuevo` | Alta de producto (elige unidad) | Autenticado | Inventario |
| `/adm/inventario/:id` | Editar: variantes, stock, costo, precio, imágenes | Autenticado | Inventario |
| `/adm/categorias` | CRUD de categorías y orden (por unidad) | Autenticado | Categorías |
| `/adm/ventas` | Listado con desglose (qué/cómo se vendió), filtros, comprobantes | Autenticado | Ventas |
| `/adm/ventas/nueva` | Crear venta: agregar productos, medio de pago, descuento | Autenticado | Ventas |
| `/adm/ventas/:id` | Detalle, comprobante PDF del cliente, reporte para facturación manual, anular | Autenticado | Ventas |
| `/adm/balance` | Balance mensual: ingresos, COGS, margen por unidad, ganancia neta | Autenticado | Balance |
| `/adm/gastos` | Registrar/editar gastos comunes (alquiler, servicios, insumos…) | Autenticado | Gastos |
| `/adm/importaciones` | Lotes de importación | Autenticado | Importaciones |
| `/adm/importaciones/:id` | Detalle de lote: costo, tipo de cambio, productos | Autenticado | Importaciones |
| `/adm/contactos` | Contactos derivados de pedidos y ventas (por celular) | Autenticado | Contactos |
| `/adm/contactos/:tel` | Historial de ese celular | Autenticado | Contactos |
| `/adm/contenido` | Banners y destacados del home | Autenticado | Contenido |
| `/adm/configuracion` | Datos del negocio, WhatsApp, stock mínimo, datos fiscales (CUIT monotributo), envíos, medios de pago | Autenticado | Configuración |

> No hay módulo "Usuarios y roles": el alta/baja de quién accede al panel se hace en **Firebase → Authentication → Usuarios**.

## 3. Flujo del cliente (público, sin cuenta)

1. Navega el catálogo y agrega productos. El carrito se guarda en `localStorage` (visible en todas las pestañas, persiste al cerrar).
2. En `/carrito` revisa y toca **Confirmar pedido**.
3. En `/carrito/confirmar` completa **solo nombre + celular**.
4. Al enviar, `orderService`:
   - crea un documento `pedido` en Firestore (estado `nuevo`, con nombre, celular e items),
   - arma un mensaje con el detalle y **abre WhatsApp** (`wa.me/<numero>?text=...`) hacia el negocio.
5. Va a `/pedido/enviado` (confirmación) y se vacía el carrito.
6. El admin ve la consulta en `/adm/notificaciones` y además recibe el WhatsApp. Coordina la venta por ese medio.

## 4. Flujo de acceso a `/adm`

1. Usuario entra a `/adm`.
2. Sin sesión → se muestra el formulario de login.
3. Credenciales OK → redirige a `/adm/dashboard`. (No hay roles: todo usuario autenticado accede a todo.)
4. Cualquier `/adm/*` se envuelve en un **guard de sesión**: sin sesión → vuelve al login (aunque la URL sea exacta).
5. En paralelo, las **Firestore Rules** exigen estar autenticado para escribir, aunque alguien intente saltarse el front.

## 5. Notas de implementación

- Layouts separados: `ShopLayout` (nav pública, footer) y `AdminLayout` (sidebar de módulos, topbar). Cada zona con su propio bundle (lazy-load de admin).
- `/adm` con meta `robots: noindex, nofollow` y excluido del `sitemap.xml`.
- Redirecciones: `/admin` → `/adm` (alias por comodidad).
- Detalle de producto por **ID único** de Firestore (`/producto/<id>`); los nombres NO necesitan ser únicos. El `slug` se guarda igual por si más adelante se quieren URLs lindas (slug + id) para SEO.
- Carrito en `localStorage` (no `sessionStorage`): compartido entre pestañas y persistente. Sincronizar pestañas con `window.addEventListener('storage', ...)`.
- Estados de pedido sugeridos: `nuevo → contactado → confirmado → entregado` (+ `cancelado`). (Sin pago online por ahora.)
- El número de WhatsApp del negocio se guarda en `/adm/configuracion`.
