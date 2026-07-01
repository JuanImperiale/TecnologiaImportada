# TI — Reglas de Negocio
> Documento de referencia. Última actualización: Junio 2026.
> Usar como base para arquitectura, desarrollo y decisiones de producto.

---

## 1. Las dos marcas

El proyecto tiene dos líneas de negocio que conviven en la misma plataforma y base de datos, pero se diferencian en reportes y balances:

- **TI Tecnología Importada**: celulares, computadoras, tablets (productos premium)
- **TI Accesorios**: fundas, protectores, cables, cargadores, audio, wearables y varios

Cada venta queda etiquetada con la marca correspondiente. Los balances mensuales muestran resultados separados por marca.

---

## 2. Productos — Celulares (TI Tecnología Importada)

Cada celular es una **unidad única** identificada por su IMEI.

**Campos por unidad:**
- Marca
- Modelo
- Color
- Almacenamiento (GB)
- Condición: Nuevo / Usado
- Batería % (valor numérico exacto)
- IMEI (identificador único — usado también como código de búsqueda rápida)
- Código de barras (puede coincidir con IMEI o ser propio del producto)
- Precio de costo (USD)
- Precio de venta (USD)
- Modo de visualización pública (ver sección 6)
- Garantía (número + unidad: meses o años)
- Fotos (opcional — se comprimen automáticamente al subir)
- Notas

**Regla de duplicados:** Al dar de alta un celular, el sistema verifica que el IMEI no exista previamente. Si ya existe, alerta al admin.

---

## 3. Productos — Accesorios (TI Accesorios)

Los accesorios se manejan por **cantidad**, no por unidad única.

**Categorías y subcategorías:**

| Categoría | Subcategorías |
|---|---|
| Fundas | Silicone Case, TPU Reforzada, Clear MagSafe, Cuero/Diseño, Varias |
| Protectores | Glass Simple, Glass Full Cover, Vidrio Cámara |
| Cargadores y Cables | Fuentes/Cabezales, Cables, Inalámbrico |
| Audio | AirPods, Parlantes |
| Wearables | Apple Watch (dispositivo), Mallas/Correas, Cases Apple Watch |
| Accesorios varios | Airtags, ChromeCast, Fundas iPad, Fundas Mac, Xiaomi, Otros |

**Campos por producto:**
- Categoría / Subcategoría
- Nombre del producto
- Compatibilidad (modelos de dispositivo)
- Variantes (ej: colores disponibles — no afectan el precio, solo el stock)
- Precio de costo (USD)
- Modo de visualización pública (ver sección 6)
- Stock actual (cantidad)
- Stock mínimo (para alertas)
- Código de barras (opcional)
- Fotos (opcional — comprimidas automáticamente)
- Garantía (si aplica — meses o años)
- Notas

**Regla de duplicados:** Al dar de alta un accesorio, el sistema busca por nombre y/o código de barras:
- Si **existe**: el admin puede agregar stock y/o nuevas variantes (colores)
- Si **no existe**: se crea como producto nuevo con cantidad inicial

**Alertas de stock:** Cuando el stock cae por debajo del mínimo configurado, se genera una alerta en el panel admin.

---

## 4. Computadoras y Tablets (TI Tecnología Importada)

Estructura similar a celulares (unidades únicas, identificadas por número de serie). Campos específicos a definir en detalle al momento de desarrollo, siguiendo la misma lógica.

---

## 5. Precios y Tipo de Cambio

### Tipo de cambio
- Se obtiene **automáticamente** de [lanacion.com.ar/dolar-hoy](https://www.lanacion.com.ar/dolar-hoy/)
- Se usa el **dólar blue precio de venta**
- Se trae en el momento de registrar la venta (no se guarda fijo)

### Modo de precio por producto (configurable al dar de alta)
Cada producto tiene un modo de visualización pública independiente:

| Modo | Descripción |
|---|---|
| USD | Se muestra el precio en dólares |
| ARS automático | Se convierte al momento con el tipo de cambio actual |
| ARS fijo | El admin ingresa un precio en pesos manualmente |
| Consultar | No se muestra precio → figura "Precio variable, consultar" |

### Precio en ventas
- El sistema sugiere el precio automáticamente
- El admin puede editarlo en el momento de registrar la venta
- Para celulares: precio base en USD, se convierte a ARS al momento de la venta

---

## 6. Medios de Pago y Recargos

Los medios de pago son **configurables** (se pueden agregar, editar o eliminar desde el panel admin).

**Medios iniciales:**

| Medio | Tipo de ingreso |
|---|---|
| Efectivo | Inmediato |
| Transferencia | Inmediato o diferido (configurable) |
| Tarjeta de crédito | Diferido — con recargo % |
| Cuenta corriente | Diferido — con recargo % |

**Recargos:**
- Porcentaje numérico configurable por medio de pago
- Editable en el momento de cada venta si es necesario

---

## 7. Ventas

### Registro de venta
- Cliente: nombre + teléfono (campos mínimos obligatorios)
- Productos: seleccionados por búsqueda (nombre, código de barras, IMEI)
- Precio: sugerido automático, editable por el admin
- Medio de pago: seleccionado al momento con recargo aplicable
- Etiqueta de marca: TI o TI Accesorios
- Fecha y hora automática
- Se genera un **comprobante interno de venta**

### Cuentas corrientes
- Clientes de confianza pueden comprar y pagar parcialmente
- El saldo pendiente se registra y se mantiene en **USD**
- Los pagos parciales se registran contra el saldo en USD
- El admin puede ver el saldo actualizado por cliente en cualquier momento

---

## 8. Sitio Público

### Características generales
- Diseño premium estilo Apple
- Una sola plataforma para TI Tecnología Importada y TI Accesorios
- Sin stock → producto **oculto** (no se muestra en el catálogo)
- Productos con modo "Consultar" → visibles pero sin precio

### Filtros
- Por dispositivo compatible (ej: "tengo un iPhone 15, mostrame todo")
- Por categoría
- Por marca/tipo
- Exploración libre

### Carrito
- El visitante no necesita cuenta ni login
- Puede agregar productos normales y productos "Precio a consultar"
- Al confirmar el carrito → formulario con nombre y teléfono del cliente
- Al enviar → se genera un mensaje de WhatsApp al número fijo del administrador con:
  - Nombre y teléfono del cliente
  - Lista de productos y precios (o "precio a consultar" según corresponda)

---

## 9. Exportar Fichas de Productos

Para compartir disponibilidad por WhatsApp con clientes interesados.

**Aplica a:** celulares y accesorios

**Flujo:**
1. El admin selecciona los productos a incluir
2. El sistema genera un preview con lista de productos y precios
3. El admin puede editar el preview antes de generar
4. Se exporta en **3 formatos**: texto (copiar/pegar), imagen, PDF

**Ficha de celular incluye:** modelo, color, almacenamiento, condición, batería %, precio, garantía

---

## 10. Panel Administrador

### Usuarios
- 2 usuarios con **permisos idénticos y totales**
- Autenticación vía Firebase Auth

### Módulos del admin
- **Productos**: CRUD completo (celulares, accesorios, computadoras, tablets)
- **Categorías**: CRUD completo
- **Ventas**: registro, historial, comprobantes internos
- **Clientes**: historial de compras, saldo de cuenta corriente
- **Stock**: alertas de stock bajo, control de inventario
- **Medios de pago**: configuración y recargos
- **Balance**: mensual, separado por marca (TI vs TI Accesorios), márgenes de ganancia
- **Exportar fichas**: generador de fichas para compartir
- **Facturación ARCA**: módulo opcional (activable desde configuración)

---

## 11. Facturación Electrónica — ARCA (ex-AFIP)

### Situación fiscal
- Dos personas, **dos CUITs distintos**, ambos Monotributistas categoría F
- Ambos con usuario activo en ARCA
- Comprobante a emitir: **Factura C** (consumidor final)

### Flujo de facturación
1. Cada venta genera un comprobante interno (siempre)
2. Al cierre de mes, el admin ve todas las ventas con formato listo para ARCA
3. El admin selecciona **manualmente** cuáles desea facturar
4. Para cada una seleccionada, elige desde qué CUIT emite
5. La app genera la Factura C electrónica vía WSFE de ARCA

### Implementación técnica
- Firebase Cloud Functions + librería `afip.js`
- Requiere (setup único por CUIT): certificado digital, punto de venta virtual registrado en ARCA, autorización del servicio WSFE
- **Módulo opcional**: se puede activar/desactivar desde configuración del admin
- La estructura de datos de ventas es compatible con ARCA desde el día 1

---

## 12. Imágenes

- Subida de fotos es **opcional** para todos los productos
- Al subir: compresión automática (formato WebP, resolución optimizada)
- Almacenamiento: Firebase Storage
- Objetivo: minimizar el consumo de almacenamiento y mejorar tiempos de carga

---

## 13. Garantías

- Configurable por producto (campo: número + unidad meses/años)
- Fecha de vencimiento = fecha de venta + garantía del producto
- Se registra como dato informativo y de seguimiento por venta

---

## 14. Arquitectura — Decisiones Pendientes de Confirmar

- **Apps**: una sola app con rutas protegidas vs dos apps separadas (pública + admin) sobre el mismo proyecto Firebase → a definir en fase de arquitectura
- **Tipo de cambio scraping**: evaluar fragilidad del scraping de lanacion.com.ar, considerar fallback manual
- **WhatsApp**: vía `wa.me` link con texto prellenado (sin API de pago) o WhatsApp Business API
- **Estructura Firestore**: a definir en fase de arquitectura

---

*Fin del documento de reglas de negocio.*
