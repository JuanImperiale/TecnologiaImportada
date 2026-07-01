/**
 * LeafletMap — mapa OpenStreetMap con pin de marca TI.
 * No requiere API key. CSS de Leaflet cargado aquí (lazy por la ruta que lo use).
 *
 * Modos:
 *   interactive=false  → visualización; clic en el pin abre Google Maps.
 *   interactive=true   → picker admin; clic en el mapa mueve el pin y llama onPick.
 */
import { useEffect, useRef } from 'react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// ── Argentina como centro por defecto ──────────────────────────────────────────
const DEFAULT_LAT = -34.6037;
const DEFAULT_LON = -58.3816;
const DEFAULT_ZOOM_VIEW = 15;
const DEFAULT_ZOOM_EMPTY = 12;

export interface MapCoords {
  lat: number;
  lon: number;
}

interface Props {
  lat?: number;
  lon?: number;
  zoom?: number;
  /** Abreviatura visible en el pin (máx 3 chars). Por defecto "TI". */
  label?: string;
  /** true → picker interactivo (admin). false → visualizador (público). */
  interactive?: boolean;
  onPick?: (coords: MapCoords) => void;
  className?: string;
}

/** Genera el DivIcon con el pin de marca usando los tokens CSS del proyecto. */
function createBrandIcon(label: string) {
  const safe = label.slice(0, 3);
  return L.divIcon({
    className: '',
    html: `<div style="
        display:flex;
        flex-direction:column;
        align-items:center;
        pointer-events:none;
      ">
      <div style="
        width:40px;height:40px;
        background:var(--ti-accent,#171717);
        border-radius:50% 50% 50% 0;
        transform:rotate(-45deg);
        display:flex;align-items:center;justify-content:center;
        box-shadow:0 3px 12px rgba(0,0,0,0.35);
        border:2px solid rgba(255,255,255,0.25);
      ">
        <span style="
          transform:rotate(45deg);
          color:var(--ti-on-accent,#fff);
          font-size:11px;
          font-weight:800;
          letter-spacing:-.5px;
          font-family:var(--ti-font-sans,-apple-system,sans-serif);
          user-select:none;
        ">${safe}</span>
      </div>
      <div style="
        width:6px;height:6px;
        background:var(--ti-accent,#171717);
        border-radius:50%;
        margin-top:2px;
        opacity:.4;
      "></div>
    </div>`,
    iconSize: [40, 52],
    iconAnchor: [20, 52],
    popupAnchor: [0, -54],
  });
}

export function LeafletMap({
  lat,
  lon,
  zoom,
  label = 'TI',
  interactive = false,
  onPick,
  className = 'h-80 w-full rounded-lg',
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef     = useRef<L.Map | null>(null);
  const markerRef  = useRef<L.Marker | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || mapRef.current) return;

    const hasCoords = lat != null && lon != null;
    const centerLat = hasCoords ? lat! : DEFAULT_LAT;
    const centerLon = hasCoords ? lon! : DEFAULT_LON;
    const initialZoom = zoom ?? (hasCoords ? DEFAULT_ZOOM_VIEW : DEFAULT_ZOOM_EMPTY);

    const map = L.map(el, {
      center: [centerLat, centerLon],
      zoom: initialZoom,
      scrollWheelZoom: interactive,
      zoomControl: true,
    });
    mapRef.current = map;

    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
      maxZoom: 19,
    }).addTo(map);

    const icon = createBrandIcon(label);

    function placeMarker(pLat: number, pLon: number) {
      if (markerRef.current) {
        markerRef.current.setLatLng([pLat, pLon]);
      } else {
        const m = L.marker([pLat, pLon], { icon, draggable: interactive }).addTo(map);
        markerRef.current = m;

        if (!interactive) {
          // Clic en el pin → abre Google Maps en nueva pestaña
          m.on('click', () => {
            window.open(
              `https://www.google.com/maps/dir/?api=1&destination=${pLat},${pLon}`,
              '_blank',
              'noopener,noreferrer',
            );
          });
          m.getElement()?.setAttribute('style', 'cursor:pointer');
        }

        if (interactive) {
          m.on('dragend', () => {
            const pos = m.getLatLng();
            onPick?.({ lat: pos.lat, lon: pos.lng });
          });
        }
      }
    }

    if (hasCoords) placeMarker(lat!, lon!);

    // Recalcula tamaño y recentra para evitar desfasajes cuando el mapa entra
    // en contenedores dinámicos o pestañas recién visibles.
    const syncView = () => {
      map.invalidateSize();
      if (hasCoords) {
        map.setView([lat!, lon!], initialZoom, { animate: false });
        markerRef.current?.setLatLng([lat!, lon!]);
      }
    };

    const rafId = window.requestAnimationFrame(syncView);
    const timeoutId = window.setTimeout(syncView, 120);
    window.addEventListener('resize', syncView);

    if (interactive) {
      map.on('click', (e) => {
        placeMarker(e.latlng.lat, e.latlng.lng);
        onPick?.({ lat: e.latlng.lat, lon: e.latlng.lng });
      });
    }

    return () => {
      window.cancelAnimationFrame(rafId);
      window.clearTimeout(timeoutId);
      window.removeEventListener('resize', syncView);
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Actualiza posición cuando las props cambian (modo visualización)
  useEffect(() => {
    if (!mapRef.current || lat == null || lon == null) return;
    mapRef.current.invalidateSize();
    mapRef.current.setView([lat, lon], zoom ?? DEFAULT_ZOOM_VIEW, { animate: false });
    markerRef.current?.setLatLng([lat, lon]);
  }, [lat, lon, zoom]);

  return <div ref={containerRef} className={className} />;
}
