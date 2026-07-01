import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import dayjs from 'dayjs';
import 'dayjs/locale/es';

dayjs.locale('es');

/** Une clases de Tailwind resolviendo conflictos (patrón shadcn). */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const ARS = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  maximumFractionDigits: 0,
});

/** Formatea un número como pesos argentinos. Ej: 129900 -> "$ 129.900". */
export function formatMoney(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return ARS.format(0);
  return ARS.format(Math.round(value));
}

/** Formatea un número como dólares. Ej: 1500 -> "US$ 1.500". */
export function formatUsd(value: number | null | undefined): string {
  const n = value == null || Number.isNaN(value) ? 0 : value;
  return `US$ ${Math.round(n).toLocaleString('es-AR')}`;
}

/** Formatea un precio según su moneda ('ARS' | 'USD'). */
export function formatPrice(value: number | null | undefined, moneda: 'ARS' | 'USD'): string {
  return moneda === 'USD' ? formatUsd(value) : formatMoney(value);
}

/** Formatea una fecha. Acepta Date, número (ms) o string ISO. */
export function formatDate(value: Date | number | string, format = 'DD/MM/YYYY'): string {
  return dayjs(value).format(format);
}

/** Convierte un valor de Firestore (Timestamp | Date | número) a Date. */
export function toDate(value: unknown): Date {
  const v = value as { toDate?: () => Date } | Date | number | undefined;
  if (v && typeof (v as { toDate?: () => Date }).toDate === 'function') {
    return (v as { toDate: () => Date }).toDate();
  }
  if (v instanceof Date) return v;
  if (typeof v === 'number') return new Date(v);
  return new Date();
}

/** Clave de mes "YYYY-MM" a partir de una fecha. */
export function monthKey(value: unknown): string {
  return dayjs(toDate(value)).format('YYYY-MM');
}

/**
 * Devuelve una imagen de Cloudinary recortada a cuadrado y optimizada, para que
 * todas las imágenes se muestren con la misma resolución. Si la URL no es de
 * Cloudinary (ej. el logo local), la devuelve sin cambios.
 *
 * @param size lado del cuadrado en px (default 600)
 */
export function squareImg(url: string | undefined | null, size = 600): string {
  if (!url) return '';
  const marker = '/upload/';
  const i = url.indexOf(marker);
  if (!url.includes('res.cloudinary.com') || i === -1) return url;
  const t = `c_fill,g_auto,w_${size},h_${size},q_auto,f_auto`;
  return `${url.slice(0, i + marker.length)}${t}/${url.slice(i + marker.length)}`;
}

/** Genera un slug URL-friendly a partir de un texto. */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // quita acentos
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
