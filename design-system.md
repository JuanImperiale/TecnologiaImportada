# Sistema de diseño — Tecnología Importada

Estilo central acordado: **Minimal premium** (estética tipo Apple, fiel a los logos).
Modo **claro y oscuro dinámico**, seleccionable desde Configuración (Claro / Oscuro / Sistema).

Archivos de este sistema:
- `theme-tokens.css` — tokens (colores, tipografía, espaciado) listos para importar.
- `design-system.md` — este documento (specs y snippets).
- `mockups-tecnologia-importada.html` — referencia visual interactiva.

---

## 1. Principios

Limpio, mucho espacio en blanco, tipografía bold para titulares y jerarquía clara. El color casi no se usa como decoración: el protagonista es el contraste negro/beige (claro) o claro/negro (oscuro). El acento es monocromo (near-black / near-white); el color solo aparece en estados (éxito, error, descuento). Bordes finos (1px) en vez de sombras pesadas. Esquinas redondeadas suaves y botones tipo "pill".

## 2. Color

Tokens definidos en `theme-tokens.css`. Resumen:

| Token | Claro | Oscuro | Uso |
|---|---|---|---|
| `--ti-bg` | `#eceae3` | `#0e0e0e` | Fondo de página |
| `--ti-surface` | `#ffffff` | `#1a1a1a` | Cards, nav |
| `--ti-surface-2` | `#f4f2ec` | `#161616` | Inputs, thumbnails, chips |
| `--ti-text` | `#171717` | `#f5f4f0` | Texto principal |
| `--ti-text-soft` | `#6b6a64` | `#9a9890` | Texto secundario |
| `--ti-accent` | `#171717` | `#f5f4f0` | CTA y estados activos |
| `--ti-on-accent` | `#ffffff` | `#111111` | Texto sobre accent |
| `--ti-line` | `rgba(0,0,0,.10)` | `rgba(255,255,255,.10)` | Bordes |
| `--ti-sale` | `#c0443c` | `#e87b73` | Badge de descuento |

Semánticos: `--ti-success`, `--ti-danger`, `--ti-warning`, `--ti-info` (cada uno con su `-bg`).

Regla clave: el botón principal usa `--ti-accent` + `--ti-on-accent`. Al cambiar de modo se invierte solo (negro en claro, blanco en oscuro). Nunca hardcodear `#000` / `#fff` en componentes: usar siempre las variables.

## 3. Tipografía

Familia: Helvetica Neue / Inter (`--ti-font-sans`). Dos pesos de trabajo (400 y 500) más bold/black (700/800) reservado para titulares y logo.

| Rol | Tamaño | Peso | Tracking |
|---|---|---|---|
| Hero | `--ti-fs-hero` (28–46px) | 800 | -0.03em |
| Título sección (h2) | 21px | 700 | -0.02em |
| Título producto (h1 PDP) | 30px | 700 | -0.02em |
| Cuerpo | 15–16px | 400 | normal |
| Etiqueta / categoría | 11–12px | 700 | +0.06em, MAYÚSCULAS |
| Secundario | 13px | 400 | normal |

Siempre sentence case en textos de interfaz; las MAYÚSCULAS solo para micro-etiquetas (categorías, eyebrows).

## 4. Espaciado, radios y elevación

Escala base 4px (`--ti-space-1` … `--ti-space-10`). Contenedor máx. `1180px`.

Radios: cards `--ti-radius-lg` (18px), inputs/thumbs `--ti-radius-md` (14px), botones y chips `--ti-radius-pill`.

Elevación: preferir borde `1px solid var(--ti-line)` + `--ti-shadow` sutil. Evitar sombras duras. En oscuro las sombras son más profundas (ya resuelto en tokens).

## 5. Componentes (specs)

Botón primario: bg `--ti-accent`, texto `--ti-on-accent`, padding `13px 20px`, radio pill, peso 700. Hover: `brightness(1.06)`. Variante `ghost`: bg `--ti-surface-2`, texto `--ti-text`, borde `--ti-line`.

Card de producto: `--ti-surface`, borde `--ti-line`, radio lg, sombra sutil. Thumbnail cuadrado (`aspect-ratio:1/1`) sobre `--ti-surface-2`. Hover: `translateY(-4px)`. Badge de descuento arriba-izquierda con `--ti-sale`. Botón "+" circular con accent. Reseñas en estrellas ámbar (`#f5a623`).

Nav superior: card flotante con logo (punto de acento + nombre), links, buscador tipo pill y acciones (favoritos, carrito con badge de cantidad).

Chips de categoría: pill, inactivo `--ti-chip`; activo `--ti-accent` + `--ti-on-accent`.

Grid de catálogo: `repeat(auto-fill, minmax(220px, 1fr))`, gap 18px. En móvil: 2 columnas.

PDP: galería (imagen grande + thumbnails) + panel de info (título, rating, precio, ahorro, swatches de color, selector de cantidad, CTA agregar/comprar, tabla de specs).

Carrito: líneas de producto (icono, nombre, variante, precio, eliminar) + panel resumen sticky (subtotal, envío, código promo, total, CTA finalizar, sellos de pago seguro y cuotas).

## 6. Cambio de tema desde Configuración

Tres opciones: **Claro**, **Oscuro**, **Sistema**. Se aplica con el atributo `data-theme` en `<html>` y se persiste en `localStorage`. Snippet base:

```js
// Aplica y persiste el tema
function setTheme(mode /* "light" | "dark" | "system" */) {
  document.documentElement.setAttribute("data-theme", mode);
  localStorage.setItem("ti-theme", mode);
}
// Al iniciar la app (antes del primer render, para evitar flash)
const saved = localStorage.getItem("ti-theme") || "system";
document.documentElement.setAttribute("data-theme", saved);
```

`theme-tokens.css` ya resuelve `data-theme="system"` según `prefers-color-scheme`.

## 7. Integración con React

### Opción A — Tailwind + shadcn/ui (recomendada para minimal premium)

Mapear las variables CSS en `tailwind.config`:

```js
// tailwind.config.js
export default {
  darkMode: ["class", '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        bg: "var(--ti-bg)", surface: "var(--ti-surface)", "surface-2": "var(--ti-surface-2)",
        text: "var(--ti-text)", "text-soft": "var(--ti-text-soft)",
        accent: "var(--ti-accent)", "on-accent": "var(--ti-on-accent)",
        line: "var(--ti-line)", sale: "var(--ti-sale)",
      },
      borderRadius: { md: "var(--ti-radius-md)", lg: "var(--ti-radius-lg)", pill: "var(--ti-radius-pill)" },
      fontFamily: { sans: "var(--ti-font-sans)" },
      maxWidth: { container: "var(--ti-container)" },
    },
  },
};
```

Importar `theme-tokens.css` en el entry (`main.tsx`) y usar clases como `bg-surface text-text border border-line rounded-lg`.

### Opción B — Material UI (MUI v6)

Crear dos themes leyendo las mismas decisiones:

```ts
import { createTheme } from "@mui/material/styles";

const base = {
  shape: { borderRadius: 14 },
  typography: { fontFamily: '"Helvetica Neue", Inter, system-ui, sans-serif', button: { fontWeight: 700, textTransform: "none" } },
};

export const lightTheme = createTheme({
  ...base,
  palette: {
    mode: "light",
    background: { default: "#eceae3", paper: "#ffffff" },
    text: { primary: "#171717", secondary: "#6b6a64" },
    primary: { main: "#171717", contrastText: "#ffffff" },
    error: { main: "#c0443c" }, success: { main: "#1f9d57" },
  },
});

export const darkTheme = createTheme({
  ...base,
  palette: {
    mode: "dark",
    background: { default: "#0e0e0e", paper: "#1a1a1a" },
    text: { primary: "#f5f4f0", secondary: "#9a9890" },
    primary: { main: "#f5f4f0", contrastText: "#111111" },
    error: { main: "#e87b73" }, success: { main: "#4cc585" },
  },
});
```

Envolver la app en `<ThemeProvider theme={mode === 'dark' ? darkTheme : lightTheme}>` y resolver `system` con `useMediaQuery('(prefers-color-scheme: dark)')`.

## 8. Pendiente para la fase de desarrollo

Logo en SVG (vectorial) para nav y favicon · fuente definitiva con licencia · imágenes reales de producto · breakpoints finales · accesibilidad (contraste AA, foco visible, `aria-label` en botones de ícono).
