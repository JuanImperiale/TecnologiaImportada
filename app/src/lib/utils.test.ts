import { describe, expect, it } from 'vitest';
import { baseDescuentoEfectivo, calcDescuento, chunk, matchesSearch, PUBLIC_SITE_URL, productPublicUrl } from './utils';

describe('baseDescuentoEfectivo', () => {
  const it_ = (negocio: string, moneda: string, precioUnitario: number, cantidad = 1, tipo = 'venta') => ({
    negocio,
    moneda,
    tipo,
    precioUnitario,
    cantidad,
  });

  it('only counts accessories sold in pesos', () => {
    const items = [
      it_('accesorios', 'ARS', 6400, 2),
      it_('productos', 'ARS', 50000),
      it_('accesorios', 'USD', 30),
      it_('productos', 'USD', 900),
      it_('accesorios', 'ARS', 5000, 1, 'bonificacion'),
    ];
    expect(baseDescuentoEfectivo(items)).toBe(12800);
  });

  it('is 0 when there are no ARS accessories', () => {
    expect(baseDescuentoEfectivo([it_('productos', 'ARS', 50000)])).toBe(0);
  });
});

describe('calcDescuento', () => {
  it('computes the percentage rounded to whole pesos', () => {
    expect(calcDescuento(6400, 10)).toBe(640);
    expect(calcDescuento(6400, 15)).toBe(960);
    expect(calcDescuento(9999, 10)).toBe(1000);
  });

  it('clamps the percentage to 0–100 and ignores invalid input', () => {
    expect(calcDescuento(1000, 150)).toBe(1000);
    expect(calcDescuento(1000, -5)).toBe(0);
    expect(calcDescuento(1000, Number.NaN)).toBe(0);
  });

  it('returns 0 when there is nothing in pesos', () => {
    expect(calcDescuento(0, 10)).toBe(0);
  });
});

describe('productPublicUrl', () => {
  it('builds the public product link on the production domain', () => {
    expect(productPublicUrl('92i3FIefch1qfdL99qCR')).toBe(
      `${PUBLIC_SITE_URL}/producto/92i3FIefch1qfdL99qCR`,
    );
    expect(PUBLIC_SITE_URL).not.toMatch(/\/$/);
  });

  it('encodes unsafe characters in the id', () => {
    expect(productPublicUrl('a/b c')).toBe(`${PUBLIC_SITE_URL}/producto/a%2Fb%20c`);
  });
});

describe('chunk', () => {
  it('splits into groups of the given size', () => {
    expect(chunk([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
  });

  it('returns no groups for an empty list', () => {
    expect(chunk([], 30)).toEqual([]);
  });

  it('keeps 30 labels per page', () => {
    const pages = chunk(Array.from({ length: 61 }, (_, i) => i), 30);
    expect(pages.map((p) => p.length)).toEqual([30, 30, 1]);
  });
});

describe('matchesSearch', () => {
  it('matches every word in any order, case and accent insensitive', () => {
    expect(matchesSearch('PRO airpods', 'AirPods Pro 3')).toBe(true);
    expect(matchesSearch('cafe', 'Café')).toBe(true);
  });

  it('requires all words to be present across fields', () => {
    expect(matchesSearch('cable micro', 'Cable Silicone Color', 'USB to Micro')).toBe(true);
    expect(matchesSearch('cable lightning', 'Cable Silicone USB to Micro')).toBe(false);
  });

  it('matches everything for an empty query and ignores missing fields', () => {
    expect(matchesSearch('   ', 'x')).toBe(true);
    expect(matchesSearch('sku1', undefined, null, 'SKU1')).toBe(true);
  });
});
