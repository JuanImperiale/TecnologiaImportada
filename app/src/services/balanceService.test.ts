import { describe, expect, it } from 'vitest';
import { computeBalance } from './balanceService';
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
