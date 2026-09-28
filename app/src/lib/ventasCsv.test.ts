import { describe, expect, it } from 'vitest';
import { exportarVentasCsv } from './ventasCsv';
import type { PagoRegistrado } from '@/models';
import type { Venta } from '@/models';

function venta(numero: number, fecha: string, items: Venta['items']): Venta {
  return {
    id: `venta-${numero}`,
    numero,
    negocio: 'productos',
    items,
    totalUsd: 100,
    totalArs: 2000,
    costoUsd: 70,
    costoArs: 1500,
    costoBonifUsd: 0,
    costoBonifArs: 0,
    envio: { metodo: 'retiro', costo: 0 },
    pago: { usd: 100, ars: 2000, medioArs: 'transferencia_emmy', tipoCambio: 1200 },
    canal: 'presencial',
    cliente: { nombre: 'Ana "A"', celular: '5491112345678', cuitDni: '12345678' },
    estado: 'confirmada',
    facturacion: { estado: 'facturada', tipo: 'C', nroFacturaC: '0001-12', cae: '123456' },
    vendedorId: 'admin@example.com',
    creado: { toDate: () => new Date(`${fecha}T12:00:00`) } as Venta['creado'],
  };
}

const item = (productId: string, nombre: string): Venta['items'][number] => ({
  productId,
  nombre,
  negocio: 'productos',
  tipo: 'venta',
  cantidad: 2,
  moneda: 'USD',
  precioUnitario: 50,
  costoUnitario: 35,
});

describe('exportarVentasCsv', () => {
  it('exports all sales for the selected month as one detailed row per item', () => {
    const csv = exportarVentasCsv(
      [
        venta(1, '2026-09-05', [item('p1', 'iPhone'), item('p2', 'Cargador')]),
        venta(2, '2026-09-20', [item('p3', 'Tablet')]),
        venta(3, '2026-08-20', [item('p4', 'Fuera de mes')]),
      ],
      '2026-09',
    );
    const rows = csv.split('\r\n');

    expect(rows).toHaveLength(4);
    expect(rows[0]).toContain('"Celular";"CUIT/DNI";"ID producto";"Producto"');
    expect(rows[1]).toContain('"Ana ""A"""');
    expect(rows[1]).toContain('"Transferencia Emmy"');
    expect(rows[1]).toContain('"iPhone"');
    expect(rows[2]).toContain('"Cargador"');
    expect(rows[3]).toContain('"Tablet"');
    expect(csv).not.toContain('Fuera de mes');
  });

  it('keeps a sale with no item details and exports bonifications with zero income', () => {
    const bonificacion = { ...item('p5', 'Funda'), tipo: 'bonificacion' as const };
    const csv = exportarVentasCsv(
      [venta(4, '2026-09-12', [bonificacion]), venta(5, '2026-09-13', [])],
      '2026-09',
    );

    expect(csv).toContain('"bonificacion";"2";"USD";"50";"0";"35";"70"');
    expect(csv).toContain('"5";"13/09/2026 12:00";"confirmada"');
  });

  it('exports the receivable reference and each partial payment', () => {
    const saleFromAccount: Venta = {
      ...venta(6, '2026-09-25', [item('p6', 'iPhone')]),
      cuentaCobrarId: 'cuenta-6',
      pagosDetalle: [{
        fecha: { toDate: () => new Date('2026-09-10T12:00:00') } as PagoRegistrado['fecha'],
        monto: 50,
        moneda: 'USD',
        medio: 'efectivo',
        registradoPor: 'admin@example.com',
      }],
    };

    const csv = exportarVentasCsv([saleFromAccount], '2026-09');
    expect(csv).toContain('"ID cuenta por cobrar";"Detalle pagos parciales"');
    expect(csv).toContain('"cuenta-6";"10/09/2026 USD 50 Efectivo (admin@example.com)"');
  });
});