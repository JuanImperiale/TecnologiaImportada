import type { MedioPago, MedioPagoLegacy } from '@/models';

/** Medios de pago que se ofrecen hoy, en el orden en que se muestran. */
export const MEDIOS_PAGO: { value: MedioPago; label: string }[] = [
  { value: 'efectivo', label: 'Efectivo' },
  { value: 'transferencia_emmy', label: 'Transferencia Emmy' },
  { value: 'transferencia_sole', label: 'Transferencia Sole' },
  { value: 'qr', label: 'QR postnet' },
];

const LABELS: Record<MedioPago | MedioPagoLegacy, string> = {
  efectivo: 'Efectivo',
  transferencia_emmy: 'Transferencia Emmy',
  transferencia_sole: 'Transferencia Sole',
  qr: 'QR postnet',
  transferencia: 'Transferencia',
  tarjeta: 'Tarjeta',
};

/** Etiqueta legible de un medio de pago (incluye los de ventas viejas). */
export function medioPagoLabel(value: string | undefined | null): string {
  if (!value) return '';
  return LABELS[value as MedioPago] ?? value;
}

/**
 * Normaliza los medios habilitados guardados en Configuración:
 * "transferencia" (viejo) pasa a ambas transferencias, "tarjeta" se descarta.
 */
export function normalizeMediosPago(saved: readonly string[] | undefined | null): MedioPago[] {
  const set = new Set<string>();
  for (const v of saved ?? []) {
    if (v === 'transferencia') {
      set.add('transferencia_emmy');
      set.add('transferencia_sole');
    } else {
      set.add(v);
    }
  }
  const result = MEDIOS_PAGO.map((m) => m.value).filter((v) => set.has(v));
  return result.length > 0 ? result : MEDIOS_PAGO.map((m) => m.value);
}
