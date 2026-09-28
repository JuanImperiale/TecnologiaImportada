import { describe, expect, it } from 'vitest';
import { computeBalance, totalesCobrados } from './balanceService';
import { monthKey } from '@/lib/utils';
import type { ItemVenta, Venta } from '@/models';

const ahora = new Date();
const ym = monthKey(ahora);

function item(partial: Partial<ItemVenta>): ItemVenta {
  return {
    productId: 'p',
    nombre: 'x',
    negocio: 'accesorios',
    cantidad: 1,
    precioUnitario: 0,
    costoUnitario: 0,
    moneda: 'ARS',
    tipo: 'venta',
    ...partial,
  };
}

function venta(items: ItemVenta[], extra: Partial<Venta> = {}): Venta {
  return {
    id: 'v',
    numero: 1,
    negocio: 'mixta',
    items,
    totalUsd: 0,
    totalArs: 0,
    costoUsd: 0,
    costoArs: 0,
    costoBonifUsd: 0,
    costoBonifArs: 0,
    envio: { metodo: 'retiro', costo: 0 },
    pago: { usd: 0, ars: 0, medioArs: 'efectivo', tipoCambio: 0 },
    canal: 'presencial',
    estado: 'confirmada',
    facturacion: { estado: 'sin_facturar', tipo: 'C' },
    vendedorId: '',
    creado: ahora as unknown as Venta['creado'],
    ...extra,
  };
}

describe('computeBalance – USD cobrado en pesos', () => {
  const ray = item({ negocio: 'productos', moneda: 'USD', precioUnitario: 600, costoUnitario: 470 });

  it('moves a USD sale paid fully in pesos to ARS at the sale exchange rate', () => {
    const v = venta([ray], { totalUsd: 600, pago: { usd: 0, ars: 889200, medioArs: 'transferencia_sole', tipoCambio: 1482 } });
    const b = computeBalance([v], [], ym);
    expect(b.usd.ingresos.total).toBe(0);
    expect(b.usd.costo.total).toBe(0);
    expect(b.ars.ingresos.productos).toBe(889200);
    expect(b.ars.costo.productos).toBe(696540);
    expect(b.ars.margen.total).toBe(192660);
  });

  it('splits proportionally when part is paid in dollars', () => {
    const v = venta([ray], { totalUsd: 600, pago: { usd: 300, ars: 444600, medioArs: 'efectivo', tipoCambio: 1482 } });
    const b = computeBalance([v], [], ym);
    expect(b.usd.ingresos.total).toBe(300);
    expect(b.usd.costo.total).toBe(235);
    expect(b.ars.ingresos.productos).toBe(444600);
  });

  it('stays in USD when paid in dollars or when no rate can be derived', () => {
    const enUsd = venta([ray], { totalUsd: 600, pago: { usd: 600, ars: 0, medioArs: 'efectivo', tipoCambio: 1482 } });
    const sinTc = venta([ray], { totalUsd: 600, pago: { usd: 0, ars: 0, medioArs: 'efectivo', tipoCambio: 0 } });
    expect(computeBalance([enUsd], [], ym).usd.ingresos.total).toBe(600);
    expect(computeBalance([sinTc], [], ym).usd.ingresos.total).toBe(600);
  });

  it('derives the rate from the extra pesos collected when none was saved', () => {
    const v = venta([ray], { totalUsd: 600, pago: { usd: 0, ars: 889200, medioArs: 'transferencia', tipoCambio: 0 } });
    const b = computeBalance([v], [], ym);
    expect(b.usd.ingresos.total).toBe(0);
    expect(b.ars.ingresos.productos).toBe(889200);
    expect(b.ars.costo.productos).toBe(696540);
  });

  it('totalesCobrados converts the pesos-paid USD part and adds shipping', () => {
    const v = venta([ray], {
      totalUsd: 600,
      totalArs: 1000,
      envio: { metodo: 'envio', costo: 500 },
      pago: { usd: 0, ars: 890700, medioArs: 'efectivo', tipoCambio: 1482 },
    });
    expect(totalesCobrados(v)).toEqual({ usd: 0, ars: 1000 + 500 + 889200 });
  });
});

describe('computeBalance – descuento efectivo', () => {
  it('keeps ARS income unchanged when there is no discount', () => {
    const b = computeBalance([venta([item({ precioUnitario: 6400, costoUnitario: 3000 })])], [], ym);
    expect(b.ars.ingresos.total).toBe(6400);
    expect(b.ars.margen.total).toBe(3400);
    expect(b.descuentosArs).toBe(0);
  });

  it('subtracts the discount from ARS income and margin', () => {
    const v = venta([item({ precioUnitario: 6400, costoUnitario: 3000 })], {
      descuento: { porcentaje: 10, montoArs: 640 },
    });
    const b = computeBalance([v], [], ym);
    expect(b.ars.ingresos.accesorios).toBe(5760);
    expect(b.ars.margen.total).toBe(2760);
    expect(b.descuentosArs).toBe(640);
    expect(b.netaArs).toBe(2760);
  });

  it('takes the discount only from ARS accessories in a mixed sale and leaves USD untouched', () => {
    const v = venta(
      [
        item({ negocio: 'productos', precioUnitario: 3000 }),
        item({ negocio: 'accesorios', precioUnitario: 1000 }),
        item({ negocio: 'productos', moneda: 'USD', precioUnitario: 500 }),
      ],
      { descuento: { porcentaje: 10, montoArs: 100 } },
    );
    const b = computeBalance([v], [], ym);
    expect(b.ars.ingresos.productos).toBe(3000);
    expect(b.ars.ingresos.accesorios).toBe(900);
    expect(b.usd.ingresos.total).toBe(500);
  });

  it('ignores discounts of cancelled sales', () => {
    const v = venta([item({ precioUnitario: 1000 })], {
      estado: 'anulada',
      descuento: { porcentaje: 10, montoArs: 100 },
    });
    expect(computeBalance([v], [], ym).descuentosArs).toBe(0);
  });
});
