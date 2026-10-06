import { describe, expect, it } from 'vitest';
import { coincideFiltroFacturacion } from './ventas';

describe('coincideFiltroFacturacion', () => {
  it('matches all, invoiced, and uninvoiced sales including legacy missing status', () => {
    expect(coincideFiltroFacturacion('facturada', 'todas')).toBe(true);
    expect(coincideFiltroFacturacion('sin_facturar', 'todas')).toBe(true);
    expect(coincideFiltroFacturacion(undefined, 'todas')).toBe(true);
    expect(coincideFiltroFacturacion('facturada', 'facturada')).toBe(true);
    expect(coincideFiltroFacturacion('sin_facturar', 'facturada')).toBe(false);
    expect(coincideFiltroFacturacion('facturada', 'sin_facturar')).toBe(false);
    expect(coincideFiltroFacturacion('sin_facturar', 'sin_facturar')).toBe(true);
    expect(coincideFiltroFacturacion(undefined, 'sin_facturar')).toBe(true);
  });
});