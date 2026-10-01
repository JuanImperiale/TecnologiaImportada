import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import type { ReactNode } from 'react';
import type { Gasto, Regalo, Venta } from '@/models';
import { formatMoney, formatUsd } from '@/lib/utils';
import { BalancePage } from './BalancePage';

const testState = vi.hoisted(() => ({ withSales: true }));
const fecha = new Date() as unknown as Venta['creado'];
const ventas: Venta[] = [{
  id: 'v1', numero: 1, negocio: 'mixta',
  items: [
    { productId: 'usd', nombre: 'Producto', negocio: 'productos', moneda: 'USD', tipo: 'venta', cantidad: 1, precioUnitario: 100, costoUnitario: 40 },
    { productId: 'ars', nombre: 'Accesorio', negocio: 'accesorios', moneda: 'ARS', tipo: 'venta', cantidad: 1, precioUnitario: 104500, costoUnitario: 36250 },
    { productId: 'bonif', nombre: 'Bonificación', negocio: 'accesorios', moneda: 'ARS', tipo: 'bonificacion', cantidad: 1, precioUnitario: 0, costoUnitario: 2500 },
  ],
  totalUsd: 100, totalArs: 104000, costoUsd: 40, costoArs: 38750,
  costoBonifUsd: 0, costoBonifArs: 2500,
  descuento: { porcentaje: 0, montoArs: 500 },
  envio: { metodo: 'envio', costo: 500 },
  pago: { usd: 100, ars: 104500, medioArs: 'efectivo', tipoCambio: 0 },
  canal: 'presencial', estado: 'confirmada', facturacion: { estado: 'sin_facturar', tipo: 'C' },
  vendedorId: 'admin', creado: fecha,
}];
const gastos: Gasto[] = [{
  id: 'g1', concepto: 'Insumos', categoria: 'insumos', monto: 1000,
  fecha, recurrente: false, creadoPor: 'admin',
}];
const regalos: Regalo[] = [{
  id: 'r1', creado: fecha, registradoPor: 'admin',
  items: [
    { productId: 'a1', nombre: 'Regalo ARS', negocio: 'accesorios', moneda: 'ARS', cantidad: 1, costoUnitario: 13500 },
    { productId: 'a2', nombre: 'Regalo USD', negocio: 'accesorios', moneda: 'USD', cantidad: 1, costoUnitario: 5 },
  ],
}];

vi.mock('react-router-dom', () => ({ Link: ({ to, children }: { to: string; children: ReactNode }) => <a href={to}>{children}</a> }));
vi.mock('@/hooks/useVentas', () => ({ useVentas: () => ({ ventas: testState.withSales ? ventas : [], loading: false }) }));
vi.mock('@/hooks/useGastos', () => ({ useGastos: () => ({ gastos, loading: false }) }));
vi.mock('@/hooks/useRegalos', () => ({ useRegalos: () => ({ regalos, loading: false }) }));

describe('BalancePage', () => {
  it('shows post-margin adjustments and monthly net for each currency without subtracting included costs twice', () => {
    const html = renderToStaticMarkup(<BalancePage />);
    const [usdTable, arsTable] = html.match(/<table\b[\s\S]*?<\/table>/g) ?? [];

    expect(usdTable).toContain('Margen total');
    expect(usdTable).toContain(formatUsd(60));
    expect(usdTable).toContain(`−${formatUsd(5)}`);
    expect(usdTable).toContain('Ganancia final del mes');
    expect(usdTable).toContain(formatUsd(55));

    expect(arsTable).toContain('Margen total');
    expect(arsTable).toContain(formatMoney(65250));
    expect(arsTable).toContain(formatMoney(500));
    expect(arsTable).toContain(`−${formatMoney(13500)}`);
    expect(arsTable).toContain(`−${formatMoney(1000)}`);
    expect(arsTable).toContain('Ganancia final del mes');
    expect(arsTable).toContain(formatMoney(51250));
  });

  it('shows monthly losses from gifts and expenses even without sales', () => {
    testState.withSales = false;
    try {
      const html = renderToStaticMarkup(<BalancePage />);
      const [usdTable, arsTable] = html.match(/<table\b[\s\S]*?<\/table>/g) ?? [];

      expect(usdTable).toContain(`−${formatUsd(5)}`);
      expect(usdTable).toContain(formatUsd(-5));
      expect(arsTable).toContain(formatMoney(-14500));
    } finally {
      testState.withSales = true;
    }
  });
});