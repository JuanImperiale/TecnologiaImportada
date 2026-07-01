# Módulos y reglas de negocio — Panel admin

Especificación funcional del panel de administración de Tecnología Importada.
Documentos relacionados: `architecture.md`, `routes.md`, `design-system.md`.

## Concepto transversal: doble unidad de negocio

El negocio tiene **dos unidades**:
- **Productos** (Tecnología Importada — línea principal)
- **Accesorios** (subnegocio)

Cada producto, cada venta y cada cálculo de margen se atribuye a una unidad mediante el campo `negocio: "productos" | "accesorios"`. Los **gastos son comunes** a ambas (alquiler, servicios, insumos del local). Por eso el balance separa ingresos y margen por unidad, pero resta los gastos sobre el total (con prorrateo opcional). Ver módulo Balance.

## Acceso (sin roles)

Decisión de negocio: **no hay roles**. Cualquier usuario habilitado en Firebase Authentication (Email/Password) que pueda iniciar sesión tiene **acceso completo** a todos los módulos del panel (incluidos Balance, Gastos, Configuración y los reportes de facturación).

El control de acceso es la **lista de usuarios de Firebase Auth**: para sumar o quitar a alguien del panel se gestiona desde la consola (Authentication → Usuarios). No hay módulo de "Usuarios y roles" dentro de la app.

La seguridad real es: **guard de sesión** en el front + **Firestore Rules** que exigen `request.auth != null` para escribir. No alcanza con ocultar botones.

---

## 1. Notificaciones (consultas de carrito)

Cada vez que un cliente confirma el carrito en la tienda se crea una notificación (documento en `pedidos`, ver architecture.md). Este módulo es la bandeja de entrada del admin.

Funciones:
- Lista de consultas con **nombre, celular, productos, fecha** y estado.
- Estados: `nuevo` → `visto` → `atendido`. (Opcional `descartado`.)
- Marcar como **atendido** registra quién lo atendió (`atendidoPor`) y cuándo (`atendidoEn`).
- Marcar como **visto** automáticamente al abrir el detalle (para saber si todavía no lo miró nadie).
- **Contador de no atendidos** como badge en el menú lateral (lo que pidió el cliente: ver si quedan pendientes).
- Filtros: pendientes / atendidos / todos; por fecha.
- Acción rápida: **"Responder por WhatsApp"** (abre wa.me al celular del cliente con un saludo prearmado).
- Acción rápida: **"Convertir en venta"** → abre el módulo Ventas con los productos precargados.

Regla: una notificación no descuenta stock; es solo una consulta. El stock se mueve cuando se concreta una venta.

---

## 2. Inventario (Productos y Accesorios)

Vista dividida en dos pestañas/secciones según `negocio`: **Productos** y **Accesorios**. Misma estructura de datos, distinta unidad.

Funciones:
- Ver listado con **stock actual**, precio, costo, estado (activo/inactivo) y unidad.
- **Dar de alta**, **editar**, **eliminar** (eliminar = *soft delete*: marca `activo: false` para no romper ventas históricas; no borra el documento).
- Carga de imágenes a Firebase Storage.
- Búsqueda y filtro por categoría, unidad, stock bajo.
- **Alerta de stock bajo**: si `stock <= stockMinimo`, se resalta y aparece en el dashboard.
- Gestión de **variantes** (color, capacidad) con stock y precio propios.

Estructura de datos de un producto (colección `products`):

| Campo | Tipo | Nota |
|---|---|---|
| `nombre` | string | |
| `slug` | string | para URL pública |
| `negocio` | `"productos"` \| `"accesorios"` | unidad de negocio |
| `categoria` | ref/slug | |
| `descripcion` | string | |
| `monedaVenta` | `"USD"` \| `"ARS"` | **moneda única del producto** (costo, precio y ganancia en esta moneda). Caros en USD, chicos en ARS. **No se convierte al dar de alta.** |
| `costo` | number (en `monedaVenta`) | costo de compra/importación, sin convertir |
| `gananciaModo` / `gananciaValor` | `"porcentaje"`\|`"monto"` / number | cómo se calculó el precio sugerido sobre el costo (en la misma moneda); el precio final es editable |
| `precioVenta` | number (en `monedaVenta`) | precio al público, sin conversión |
| `precioAnterior` | number (en `monedaVenta`) | opcional, para mostrar descuento |

> **La conversión USD↔ARS se hace recién en la venta**, con la cotización del día. En la tienda el producto se muestra solo en su moneda (sin "≈ en pesos").
| `sku` | string | opcional |
| `codigoBarras` | string | opcional |
| `stock` | number | o por variante |
| `stockMinimo` | number | umbral de alerta |
| `imagenes` | string[] | URLs de Storage |
| `specs` | map | ficha técnica (clave/valor) |
| `activo` | boolean | visible en tienda |
| `destacado` | boolean | aparece en home |
| `importBatchId` | ref | lote de importación (opcional) |
| `proveedor` | string/ref | opcional |
| `creado` / `actualizado` | timestamp | |

Subcolección `products/{id}/variants`: `nombre` (ej. "128GB Negro"), `sku`, `stock`, `costo`, `precioVenta`.

Reglas de stock:
- El stock **baja** al confirmar una venta y **sube** al cargar un lote de importación o al anular una venta.
- Cada movimiento se registra en `movimientosStock` (kardex): tipo (`venta`/`ingreso`/`ajuste`/`anulacion`), cantidad, motivo, usuario, fecha. Da trazabilidad y permite auditar diferencias.

---

## 3. Ventas

Módulo para registrar ventas (presenciales o coordinadas por WhatsApp) y emitir comprobantes.

### Crear venta
- Buscar y **agregar productos**, pudiendo **mezclar las dos unidades** (Productos y Accesorios) en una misma venta. Cada línea toma `precioVenta` y **guarda snapshot del costo** (`costoUnitario`) para que el margen histórico no cambie si después se actualiza el costo. Cada item conserva su `negocio`, así el balance lo atribuye correctamente.
- **Marcar cada línea como `venta` o `bonificación`** (ver sección Bonificaciones): un item bonificado va con **precio $0** pero conserva su costo real y descuenta stock.
- Editar cantidad y precio por línea; aplicar **descuento** (monto o %).
- Datos del cliente: **nombre + celular** (opcional; se pueden traer de una notificación). Para facturar conviene también CUIT/DNI (opcional).
- **Medio de pago**: efectivo / transferencia / tarjeta / QR-Mercado Pago. Si tarjeta, opción de recargo.
- **Envío**: al registrar la venta se elige **retiro en local** o **envío**; si es envío se carga el **costo/recargo de envío**, que se suma al total como línea aparte.
- Al **confirmar**: descuenta stock, registra el movimiento, asigna **número de comprobante interno** correlativo y genera el **PDF** para el cliente.

### Comprobante PDF (para el cliente)
- Generado en el cliente con una librería JS (`@react-pdf/renderer`, `jsPDF` o `pdfmake`).
- Contiene: logo, datos del negocio, número correlativo, fecha, cliente, detalle de items, subtotal, descuento, **envío**, total y medio de pago. Los items bonificados se listan como **"Bonificación — $0"** para que el cliente vea el regalo.
- Se puede **descargar y compartir** (link, WhatsApp).
- **Importante:** este comprobante **no es una factura legal**; es un recibo/orden para el cliente. La factura legal se emite aparte en ARCA (facturación manual, ver abajo).

### Reporte para facturación manual (admin)
Como no integramos ARCA automáticamente, el sistema genera lo necesario para que el admin **facture a mano** en "Comprobantes en Línea" de ARCA:
- **Por venta:** un resumen con todos los datos que pide la **Factura C** de monotributo — fecha, cliente (nombre, CUIT/DNI si se cargó), detalle de conceptos, importe total (sin IVA discriminado), medio de pago. Pensado para copiar/cargar directo en ARCA.
- **Por período (mensual):** export a **Excel/CSV** con todas las ventas a facturar (fecha, cliente, total, estado de facturación), para que el admin o el contador procesen el lote.
- Cada venta tiene un estado de facturación: `sin_facturar` / `facturada`, y campos para registrar **manualmente** el número de Factura C y el CAE una vez emitida en ARCA (sirve de control, no se conecta al organismo).

### Listado de ventas
- Todas las ventas con **desglose: qué se vendió** (items y unidades), **cómo se vendió** (medio de pago, retiro/envío, presencial/WhatsApp), total y margen.
- Filtros: por fecha, unidad, medio de pago, vendedor, estado de facturación (`sin_facturar`/`facturada`).
- Acceso al comprobante PDF del cliente y al resumen para facturación manual.
- **Anular venta**: reintegra stock y ajusta el balance (queda registrada como anulada, no se borra).

### Estructura de datos (colección `ventas`)

| Campo | Tipo | Nota |
|---|---|---|
| `numero` | number | correlativo interno |
| `negocio` | string | `productos` / `accesorios` / **`mixta`** (la atribución real es por item) |
| `items` | array | `{productId, nombre, negocio, tipo: "venta"\|"bonificacion", cantidad, precioUnitario, costoUnitario}` — en bonificación `precioUnitario = 0` y el costo sigue siendo real |
| `costoBonificaciones` | number | suma de costos de los items bonificados (cuánto se "regaló") |
| `subtotal` / `descuento` | number | |
| `envio` | map | `{metodo: "retiro"\|"envio", costo}` — el costo se suma al total |
| `total` | number | subtotal − descuento + envío |
| `costoTotal` | number | suma de costos de items (para margen) |
| `medioPago` | string | efectivo/transferencia/tarjeta/qr |
| `canal` | string | presencial / whatsapp |
| `cliente` | map | `{nombre, celular, cuitDni?}` opcional |
| `pedidoId` | ref | si vino de una notificación |
| `estado` | string | `confirmada` / `anulada` |
| `facturacion` | map | `{estado: "sin_facturar"\|"facturada", tipo: "C", nroFacturaC?, cae?}` — cargado **a mano** tras facturar en ARCA |
| `comprobantePdfUrl` | string | comprobante para el cliente |
| `vendedorId` / `creado` | | |

### Facturación: manual, no integrada
Se descartó la integración automática con ARCA (requiere web services SOAP + certificado privado del lado servidor; no aporta valor suficiente frente a la complejidad para un monotributista con un solo local). En su lugar:
- El admin **factura manualmente** en "Comprobantes en Línea" de ARCA usando el **reporte de facturación** que genera el sistema (ver arriba).
- El tipo de comprobante es **Factura C** (monotributo): importe total sin IVA discriminado.
- Tras emitir la Factura C en ARCA, el admin puede **registrar el número y el CAE** en la venta (`facturacion`) para llevar el control de qué está facturado. Es solo registro local; no se conecta al organismo.
- Si en el futuro se quiere automatizar, se podría sumar una API de terceros (TusFacturas, Facturante) vía Cloud Function, sin cambiar el resto de la app.

### Bonificaciones (regalos al cliente)
Regla del negocio: al vender un producto principal (ej. un celular) a veces se **regalan accesorios** (funda, vidrio templado, cargador). Esos accesorios **no se cobran**, pero su costo es real y se **absorbe en la ganancia del producto principal**. El objetivo es que figuren como "entregados sin ganancia", no como pérdida del subnegocio Accesorios.

Cómo se maneja:
- Al registrar la venta, cada línea se marca como **`venta`** o **`bonificación`**.
- Un item bonificado: **`precioUnitario = 0`** (no genera ingreso), conserva su **`costoUnitario` real** y **descuenta stock** (salió del inventario).
- **Margen de la venta** = ingresos − costo de *todos* los items (incluidos los bonificados). Así el celular "paga" naturalmente el regalo: su ganancia baja por el costo de los accesorios.
- **Atribución por unidad (clave):** el costo de los items bonificados **no se carga a su propia unidad**, se **transfiere a la unidad del/los producto(s) principal(es) cobrado(s)** de esa venta (normalmente Productos). Resultado:
  - El subnegocio que regala (Accesorios) queda con **margen 0** en ese item (vendido sin ganancia), no en pérdida.
  - El producto principal (Productos) absorbe el costo: su margen baja por el valor regalado.
  - Si la venta tiene productos cobrados de **las dos unidades**, el costo de la bonificación se **prorratea** entre ellas según su ingreso.
  - Caso borde: si la venta es **solo bonificación** (no hay item cobrado que absorba), ese costo se registra como **gasto de marketing/bonificaciones** del mes.

Ejemplo:

| Línea | Unidad | Tipo | Precio | Costo |
|---|---|---|---:|---:|
| Celular | Productos | venta | 500.000 | 380.000 |
| Funda | Accesorios | bonificación | 0 | 8.000 |
| Vidrio templado | Accesorios | bonificación | 0 | 4.000 |
| Cargador | Accesorios | bonificación | 0 | 12.000 |

- Ingresos de la venta = **500.000**; costo total = **404.000**; **margen = 96.000** (sin regalar habría sido 120.000).
- Costo de bonificación = **24.000**.
- Balance por unidad: **Productos** → ingreso 500.000, costo 380.000 + 24.000 absorbidos = 404.000, **margen 96.000**. **Accesorios** → ingreso 0, costo 0 (transferido), **margen 0**, pero **3 unidades entregadas** quedan registradas.

KPI sugerido (en Balance y Dashboard): **"Bonificaciones del mes"** — unidades regaladas y costo total absorbido. Permite ver cuánto se está regalando y si conviene ajustar la política.

---

## 4. Balance mensual

Visión financiera del negocio mes a mes (solo admin).

Ingresos y márgenes (por unidad y combinados):
- **Ingresos** = suma de `total` de ventas confirmadas del mes.
- **Costo de mercadería vendida (COGS)** = suma de `costoTotal` de esas ventas.
- **Margen bruto** = Ingresos − COGS. Se muestra **por unidad** (Productos y Accesorios) usando el `negocio` de **cada item** (una venta mixta reparte sus items entre ambas unidades, no se asigna entera a una sola).
- **Bonificaciones**: el costo de los items regalados se **reasigna a la unidad del producto principal cobrado** (normalmente Productos). La unidad que regala queda en **margen 0** para ese item (vendido sin ganancia), nunca en pérdida. Ver sección Bonificaciones en Ventas.
- **Envío**: el recargo de envío se contabiliza como ingreso aparte (no es margen de producto). Se muestra como línea propia para no distorsionar el margen de mercadería.

Gastos (comunes a ambas unidades):
- Registrar gastos mensuales por categoría: **alquiler, servicios, insumos del local, sueldos, impuestos, otros**.
- Gasto **recurrente** (ej. alquiler): se puede marcar para autocargarse cada mes.
- Gasto **único**: carga puntual.

Resultado:
- **Ganancia neta (combinada)** = (Margen bruto Productos + Margen bruto Accesorios) − Gastos comunes del mes.
- **Prorrateo opcional**: repartir los gastos comunes entre unidades según su participación en los ingresos, para estimar una ganancia neta por unidad. (Toggle; por defecto se muestra combinada.)

Vistas:
- Tarjetas resumen del mes: ingresos, COGS, margen bruto, gastos, ganancia neta.
- Tarjeta **Bonificaciones del mes**: unidades regaladas y costo total absorbido.
- Comparativa **Productos vs Accesorios** (ingresos y margen, ya con la absorción de bonificaciones aplicada).
- Detalle de gastos del mes (editable).
- Selector de mes/año e idealmente comparación contra el mes anterior.
- **Exportar** el balance y las ventas a Excel/CSV.

### Estructura de datos
Colección `gastos`: `concepto`, `categoria`, `monto`, `fecha`, `recurrente` (bool), `nota`, `creadoPor`.
Colección `ventas` ya aporta ingresos/COGS por mes y unidad (se agregan por consulta; opcionalmente un doc `balances/{YYYY-MM}` cacheado por una Function para no recalcular).

---

## 5. Módulos de soporte (ya definidos)

- **Categorías** — CRUD y orden, por unidad.
- **Importaciones (lotes)** — proveedor, costo, **tipo de cambio**, fecha de arribo, productos del lote. Al cargar un lote, ingresa stock y fija el `costo` de los productos.
- **Contenido / home** — banners, destacados.
- **Contactos** — derivados de pedidos y ventas, agrupados por celular.
- **Gestión de accesos** — no hay módulo en la app: se administra desde **Firebase → Authentication → Usuarios** (alta/baja de quién puede entrar).
- **Configuración** — datos del negocio, número de WhatsApp, umbral de stock bajo, datos fiscales (CUIT monotributo), medios de pago, envíos.

---

## 6. Qué conviene sumar / optimizar (revisión)

Recomendaciones para que no queden ambigüedades en el desarrollo:

1. **Soft delete en inventario** — nunca borrar productos con historial; marcar inactivo. (Ya incorporado arriba.)
2. **Snapshot de costo y precio en cada venta** — para que el margen histórico sea fiel aunque cambien costos/precios. (Incorporado.)
3. **Kardex / movimientos de stock** — colección `movimientosStock` con cada entrada/salida; permite auditar y entender diferencias.
4. **Alertas de stock bajo** — en dashboard y como badge; umbral configurable por producto/negocio.
5. **Anulación y devoluciones de ventas** — reintegran stock y corrigen balance; quedan registradas.
6. **Numeración correlativa** de comprobantes internos (independiente de ARCA).
7. **Tipo de cambio para costos en USD** — productos importados; convertir a ARS para márgenes reales.
8. **Dashboard con KPIs** — ventas del día/mes, ticket promedio, top productos, stock bajo, consultas pendientes. (Cifras financieras solo para admin.)
9. **Exportación a Excel/CSV** — ventas, balance, inventario, para backup y contador.
10. **Log de auditoría** — quién cambió precios, anuló ventas, ajustó stock (importante con varios usuarios).
11. **Caja diaria / arqueo** (opcional) — si se maneja efectivo en el local.
12. **Backups de Firestore** — export programado.
13. **App Check** — proteger la creación anónima de pedidos contra spam.

### Decisiones tomadas (cerradas)
- **Ventas mixtas:** ✅ una venta puede combinar productos de ambas unidades; `negocio = "mixta"` y la atribución al balance es **por item**.
- **Envíos:** ✅ hay envíos; el **recargo se carga al registrar la venta** (campo `envio`), se suma al total y se contabiliza como ingreso aparte.
- **Facturación:** ✅ **monotributo — Factura C**, hecha **manualmente** en ARCA con el reporte que genera el sistema (sin integración automática).
- **Local:** ✅ uno solo (no hay múltiples depósitos/sucursales; el stock es único).

### Falta definir antes de desarrollar
- Política de **descuentos** y de **recargo por tarjeta** (¿porcentaje fijo? ¿por cuotas?).
- ¿Se cargan **devoluciones parciales** o solo anulación total de la venta?
- Métodos/zonas de **envío** y si el costo es fijo, por zona o manual en cada venta.
- ¿El reporte de facturación manual lo querés **por venta**, **mensual** o ambos? (Hoy se contemplan los dos.)
