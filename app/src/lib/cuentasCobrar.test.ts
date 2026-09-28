import { describe, expect, it } from 'vitest';
import { calcularSaldosCuenta, fechaCompletaCuenta, filtrarProductosCuenta, validarPagoCuenta } from './cuentasCobrar';

describe('cuentas por cobrar', () => {
  it('cierra las sugerencias sin texto y solo ofrece productos activos disponibles', () => {
    const productos = [
      { id: 'p1', nombre: 'iPhone', negocio: 'productos', activo: true, stock: 1, categoriaId: 'c1' },
      { id: 'p2', nombre: 'AirPods', negocio: 'productos', activo: true, stock: 0, categoriaId: 'c1' },
      { id: 'a1', nombre: 'Funda', negocio: 'accesorios', activo: true, stock: 4, categoriaId: 'c1' },
    ];
    const categorias = new Map([['c1', 'Apple']]);

    expect(filtrarProductosCuenta('  ', productos, new Set(), categorias)).toEqual([]);
    expect(filtrarProductosCuenta('apple', productos, new Set(), categorias).map((producto) => producto.id)).toEqual(['p1']);
    expect(filtrarProductosCuenta('iphone', productos, new Set(['p1']), categorias)).toEqual([]);
  });

  it('calcula saldos independientes en USD y ARS', () => {
    const items = [
      { moneda: 'USD' as const, precioUnitario: 500, cantidad: 1 },
      { moneda: 'ARS' as const, precioUnitario: 200000, cantidad: 2 },
    ];
    const pagos = [
      { moneda: 'USD' as const, monto: 200 },
      { moneda: 'ARS' as const, monto: 100000 },
    ];

    expect(calcularSaldosCuenta(items, pagos)).toEqual({
      totalUsd: 500,
      totalArs: 400000,
      pagadoUsd: 200,
      pagadoArs: 100000,
      saldoUsd: 300,
      saldoArs: 300000,
      completa: false,
    });
  });

  it('marks the account complete only when both currency balances are paid', () => {
    const items = [
      { moneda: 'USD' as const, precioUnitario: 500, cantidad: 1 },
      { moneda: 'ARS' as const, precioUnitario: 200000, cantidad: 1 },
    ];
    const pagos = [
      { moneda: 'USD' as const, monto: 500 },
      { moneda: 'ARS' as const, monto: 200000 },
    ];

    expect(calcularSaldosCuenta(items, pagos).completa).toBe(true);
  });

  it('rejects empty, overpaid, and already-settled currency payments', () => {
    const saldos = calcularSaldosCuenta(
      [{ moneda: 'ARS', precioUnitario: 10000, cantidad: 1 }],
      [],
    );

    expect(validarPagoCuenta(0, 'ARS', saldos)).toBe('El monto del pago debe ser mayor que cero.');
    expect(validarPagoCuenta(10001, 'ARS', saldos)).toBe('El pago supera el saldo pendiente de ARS.');
    expect(validarPagoCuenta(10, 'USD', saldos)).toBe('La cuenta no tiene saldo pendiente en USD.');
    expect(validarPagoCuenta(10000, 'ARS', saldos)).toBeNull();
  });

  it('uses the chronological date when the final balances were covered', () => {
    const items = [
      { moneda: 'USD' as const, precioUnitario: 100, cantidad: 1 },
      { moneda: 'ARS' as const, precioUnitario: 10000, cantidad: 1 },
    ];
    const pagos = [
      { moneda: 'ARS' as const, monto: 5000, fecha: new Date('2026-09-20T12:00:00') },
      { moneda: 'USD' as const, monto: 100, fecha: new Date('2026-09-15T12:00:00') },
      { moneda: 'ARS' as const, monto: 5000, fecha: new Date('2026-09-10T12:00:00') },
    ];

    expect(fechaCompletaCuenta(items, pagos)?.toISOString()).toBe(new Date('2026-09-20T12:00:00').toISOString());
  });
});