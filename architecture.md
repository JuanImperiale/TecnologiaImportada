# Arquitectura — Tecnología Importada

Enfoque acordado: **app serverless** — frontend React desplegado en Firebase Hosting, con Firebase como backend (Firestore, Auth, Storage, Functions). Sin servidor propio que mantener.

Documentos relacionados: `design-system.md`, `theme-tokens.css`, `mockups-tecnologia-importada.html`.

---

## 1. Stack

- **Frontend:** React + Vite + TypeScript, Tailwind + shadcn/ui (usando `theme-tokens.css`).
- **Routing:** React Router. Zona pública y zona admin en la misma app, separadas por ruta y rol.
- **Backend (serverless):** Firebase.
  - **Firestore** — base de datos (documentos/colecciones).
  - **Auth** — solo para el equipo (Email/Password). **Sin roles**: cualquier usuario habilitado en Firebase Auth tiene acceso completo al panel. El público no inicia sesión.
  - **Storage** — NO se usa (requiere plan Blaze). Las imágenes de producto van a **Cloudinary** (plan gratis, sin tarjeta; upload unsigned desde el navegador). Se guardan como URL en Firestore, así que cambiar de proveedor es trivial.
  - **Hosting** — despliegue del frontend.
  - **Functions** — opcional; solo si en el futuro se agrega pago online, emails automáticos o stock atómico. El flujo actual no las necesita: el público va con lead + WhatsApp, los comprobantes/reportes PDF se generan en el front y la **facturación ARCA es manual** (Factura C de monotributo, ver `admin-modules.md`).
  - **App Check** — recomendado, para proteger la creación anónima de pedidos contra spam.

## 2. Patrón en capas (dentro del frontend)

Tres capas, responsabilidad única cada una:

| Capa | Carpeta | Responsabilidad | Ejemplos |
|---|---|---|---|
| Presentación | `components/` | Solo UI. No sabe de Firebase. | `ProductCard`, `CartDrawer`, `AdminTable` |
| Estado/datos | `hooks/` | Estado local, suscripciones, orquestación. | `useProducts`, `useCart` (localStorage + sync entre pestañas), `useAdminAuth`, `usePedidos` |
| Negocio | `services/` | Reglas centralizadas. Único punto que habla con Firebase. | `productService`, `cartService` (localStorage), `orderService` (crea pedido + arma link de WhatsApp), `authService` (login admin) |

Regla de oro: un componente nunca llama a Firestore directo. Componente → hook → service → Firebase. Esto mantiene la lógica reutilizable, testeable y fácil de mover si algún día se cambia de backend.

## 3. Estructura de carpetas

```
src/
  components/
    ui/        # shadcn (button, dialog, input…)
    shop/      # ProductCard, CategoryChips, CartDrawer, Checkout…
    admin/     # ProductForm, OrdersTable, StockEditor…
  hooks/       # useProducts, useCart, useAuth, useOrders, useTheme
  services/    # product, category, cart, order, auth, payment, upload
  lib/
    firebase.ts   # init de la app Firebase
    theme.ts      # control de tema claro/oscuro/sistema
  routes/
    (shop)/    # público:  /, /catalogo, /producto/:slug, /carrito, /carrito/confirmar, /pedido/enviado
    (admin)/   # privado:  /adm (login), /adm/dashboard, /adm/inventario, /adm/ventas, /adm/balance…
  App.tsx
firestore.rules    # BORDE DE SEGURIDAD (no es opcional)
storage.rules
functions/         # pagos / lógica sensible
firebase.json
```

## 4. Zonas: público vs admin

| | Público | Admin |
|---|---|---|
| Acceso | Abierto, **sin cuenta ni login** | Cualquier usuario habilitado en Firebase Auth |
| Ruta | `/...` | `/adm/...` (guard: requiere sesión) |
| Sobre los datos | Lee catálogo; **crea pedidos anónimos** (lead con nombre + celular) | Escribe productos, stock, precios; gestiona todos los pedidos |
| Carrito | En `localStorage` del navegador (cross-tab) | — |
| Bundle | Carga normal | Lazy-load (no se descarga para visitantes) |

No hay cuentas de cliente ni roles. El equipo se autentica con Email/Password y **todos los usuarios tienen el mismo nivel de acceso** (acceso completo al panel). El control de quién entra es la propia lista de usuarios de Firebase Auth (alta/baja desde la consola). El público es anónimo (o Anonymous Auth opcional para App Check).

## 5. Seguridad — lo más importante

Los `services` del cliente organizan el código pero **NO son una barrera de seguridad**: el usuario puede saltárselos desde la consola del navegador. La seguridad real vive en las **Firestore Security Rules**. No hay roles: el equipo es "cualquier usuario autenticado".

1. **Firestore Security Rules** — definen, por colección, quién puede leer y escribir. Catálogo: lectura pública, escritura solo autenticado. Datos del negocio (ventas, gastos, etc.): solo autenticado. Pedidos: el público puede crear (lead), solo el equipo lee/edita.

Borrador de reglas:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{db}/documents {
    function signedIn() { return request.auth != null; }   // equipo (sin roles)

    match /products/{id}   { allow read: if true;  allow write: if signedIn(); }
    match /categories/{id} { allow read: if true;  allow write: if signedIn(); }
    match /banners/{id}    { allow read: if true;  allow write: if signedIn(); }

    match /pedidos/{id} {
      // visitante anónimo puede crear su consulta, con validación de forma:
      allow create: if request.resource.data.keys().hasAll(['nombre','celular','items','estado','creado'])
                    && request.resource.data.estado == 'nuevo'
                    && request.resource.data.nombre is string
                    && request.resource.data.celular is string;
      // solo el equipo lee y actualiza:
      allow read, update, delete: if signedIn();
    }

    // ventas, gastos, movimientosStock, importBatches, settings, counters, balances
    match /{col}/{id} {
      allow read, write: if signedIn();
    }
  }
}
```

Como el `create` de `pedidos` es anónimo, conviene activar **Firebase App Check** (reCAPTCHA) para evitar spam. Validar también nombre/celular en el cliente antes de escribir.

## 6. Confirmación de pedido (panel + WhatsApp)

No hay pago online por ahora. El flujo de cierre es una **consulta/lead**:

1. El cliente arma el carrito (en `localStorage`) y toca "Confirmar pedido".
2. Completa **nombre + celular** (sin registro).
3. `orderService` crea un documento en `pedidos` (estado `nuevo`) y arma un mensaje con el detalle.
4. Se abre **WhatsApp** hacia el negocio con un link `https://wa.me/<numero>?text=<detalle codificado>`. Esto es 100% del lado del cliente, no necesita claves ni Function.
5. El admin ve la consulta en `/adm/notificaciones` y recibe el WhatsApp; coordina la venta por ese medio.

El número de WhatsApp se configura en `/adm/configuracion`. Si más adelante se quiere **pago online** (Mercado Pago), se agrega una Cloud Function (la clave secreta no puede vivir en el front) sin cambiar el resto de la arquitectura.

## 7. Modelo de datos (colecciones Firestore)

- `products` — nombre, slug, **negocio** (`productos`/`accesorios`), categoría, descripción, **precioVenta** (en su moneda), **monedaVenta** (`USD`/`ARS`), **precioVentaArs** (convertido, para balance), precioAnterior, gananciaModo/gananciaValor, **costo** (ARS), monedaCosto, costoUsd, tipoCambio, sku, stock, **stockMinimo**, imágenes[] (Cloudinary), specs, activo, destacado, importBatchId. (Ver tabla en `admin-modules.md`.) Las imágenes y el balance siempre tienen un valor en ARS; el precio se puede mostrar en USD o ARS según el producto.
- `products/{id}/variants` — nombre, sku, stock, costo, precioVenta.
- `categories` — nombre, slug, negocio, orden.
- `pedidos` — consulta/lead del carrito: **nombre, celular**, items[], subtotal, total, estado (`nuevo`→`visto`→`atendido` / `descartado`), atendidoPor, atendidoEn, creado. (Lo lee el módulo Notificaciones.)
- `ventas` — numero (correlativo), negocio (`productos`/`accesorios`/`mixta`), items[] (cada uno con `negocio`, `tipo: "venta"|"bonificacion"`, `precioUnitario` —0 si bonificación—, `costoUnitario` snapshot), subtotal, descuento, envio{metodo,costo}, total, costoTotal, costoBonificaciones, medioPago, canal, cliente{nombre,celular,cuitDni?}, pedidoId, estado (`confirmada`/`anulada`), facturacion{estado,tipo:"C",nroFacturaC?,cae?} (cargado a mano), comprobantePdfUrl, vendedorId, creado.
- `gastos` — concepto, categoría (alquiler/servicios/insumos/sueldos/impuestos/otros), monto, fecha, recurrente, nota, creadoPor. (Comunes a ambas unidades.)
- `movimientosStock` — productId, tipo (`venta`/`ingreso`/`ajuste`/`anulacion`), cantidad, motivo, usuario, fecha. (Kardex/auditoría.)
- `importBatches` — lote, proveedor, costo, tipo de cambio, fecha de arribo, productos asociados.
- `banners` — contenido del home (hero, destacados).
- `coupons` — código, tipo (%/monto), valor, vigencia, usos. (Opcional.)
- `settings` — datos del negocio, número de WhatsApp, stock mínimo por defecto, datos fiscales/ARCA (CUIT, punto de venta), medios de pago.
- `balances/{YYYY-MM}` — (opcional) caché del balance mensual calculado por una Function.
- **Carrito: NO va en Firestore.** Vive en `localStorage` (clave `ti-cart`), compartido entre pestañas. Se persiste como `pedido` recién al confirmar. Los "contactos" del admin se derivan agrupando `pedidos` y `ventas` por celular (no hay colección `customers`).

## 8. SEO

Una SPA pura indexa peor que el render en servidor. Para que Google encuentre los productos: agregar **prerendering** de las páginas de producto/catálogo (p. ej. con un prerender en el deploy) o evaluar migrar el storefront a render en servidor más adelante. No bloquea el desarrollo inicial.

## 9. Despliegue

`firebase deploy` publica Hosting + Rules + Functions. Un solo comando, un solo proveedor. Entornos sugeridos: proyecto `-dev` y `-prod` en Firebase.

## 10. Pendientes para desarrollo

Definir proveedor de envíos y costos · flujo de checkout exacto · panel de métricas del dashboard · estrategia de imágenes (tamaños/optimización) · backups de Firestore · tests de los `services`.
