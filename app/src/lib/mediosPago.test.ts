import { describe, expect, it } from 'vitest';
import { MEDIOS_PAGO, medioPagoLabel, normalizeMediosPago } from './mediosPago';

const TODOS = MEDIOS_PAGO.map((m) => m.value);

describe('normalizeMediosPago', () => {
  it('defaults to all current methods when nothing is saved', () => {
    expect(normalizeMediosPago(undefined)).toEqual(TODOS);
    expect(normalizeMediosPago([])).toEqual(TODOS);
  });

  it('maps the old "transferencia" to both transfers and drops "tarjeta"', () => {
    expect(normalizeMediosPago(['efectivo', 'transferencia', 'tarjeta', 'qr'])).toEqual(TODOS);
    expect(normalizeMediosPago(['transferencia'])).toEqual(['transferencia_emmy', 'transferencia_sole']);
  });

  it('keeps the canonical order and ignores unknown values', () => {
    expect(normalizeMediosPago(['qr', 'efectivo', 'otro'])).toEqual(['efectivo', 'qr']);
  });

  it('falls back to all methods if only removed ones were saved', () => {
    expect(normalizeMediosPago(['tarjeta'])).toEqual(TODOS);
  });
});

describe('medioPagoLabel', () => {
  it('labels current and legacy methods', () => {
    expect(medioPagoLabel('transferencia_sole')).toBe('Transferencia Sole');
    expect(medioPagoLabel('qr')).toBe('QR postnet');
    expect(medioPagoLabel('transferencia')).toBe('Transferencia');
    expect(medioPagoLabel('tarjeta')).toBe('Tarjeta');
    expect(medioPagoLabel(undefined)).toBe('');
  });
});
