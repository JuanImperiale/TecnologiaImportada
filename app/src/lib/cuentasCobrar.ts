import { matchesSearch } from '@/lib/utils';

export type MonedaCuenta = 'USD' | 'ARS';

export interface ProductoBuscableCuenta {
  id: string;
  nombre: string;
  negocio: string;
  activo: boolean;
  stock: number;
  sku?: string;
  categoriaId: string;
}

export interface LineaCuentaImporte {
  moneda: MonedaCuenta;
  precioUnitario: number;
  cantidad: number;
}

export interface PagoCuentaImporte {
  moneda: MonedaCuenta;
  monto: number;
}

export interface PagoCuentaConFecha extends PagoCuentaImporte {
  fecha: Date | { toDate: () => Date };
}

export interface SaldosCuenta {
  totalUsd: number;
  totalArs: number;
  pagadoUsd: number;
  pagadoArs: number;
  saldoUsd: number;
  saldoArs: number;
  completa: boolean;
}

export function filtrarProductosCuenta<T extends ProductoBuscableCuenta>(
  query: string,
  productos: T[],
  seleccionados: Set<string>,
  categorias: Map<string, string>,
): T[] {
  if (!query.trim()) return [];
  return productos.filter((producto) =>
    producto.negocio === 'productos' && producto.activo && producto.stock > 0 &&
    !seleccionados.has(producto.id) &&
    matchesSearch(query, producto.nombre, producto.sku, categorias.get(producto.categoriaId)),
  );
}

function redondearMoneda(monto: number): number {
  return Math.round((monto + Number.EPSILON) * 100) / 100;
}

/** Calcula deuda, pagos y saldos sin convertir entre USD y ARS. */
export function calcularSaldosCuenta(
  items: LineaCuentaImporte[],
  pagos: PagoCuentaImporte[],
  envioArs = 0,
): SaldosCuenta {
  const totalUsd = redondearMoneda(
    items.filter((item) => item.moneda === 'USD').reduce((suma, item) => suma + item.precioUnitario * item.cantidad, 0),
  );
  const totalArs = redondearMoneda(
    items.filter((item) => item.moneda === 'ARS').reduce((suma, item) => suma + item.precioUnitario * item.cantidad, 0) + envioArs,
  );
  const pagadoUsd = redondearMoneda(pagos.filter((pago) => pago.moneda === 'USD').reduce((suma, pago) => suma + pago.monto, 0));
  const pagadoArs = redondearMoneda(pagos.filter((pago) => pago.moneda === 'ARS').reduce((suma, pago) => suma + pago.monto, 0));
  const saldoUsd = redondearMoneda(Math.max(0, totalUsd - pagadoUsd));
  const saldoArs = redondearMoneda(Math.max(0, totalArs - pagadoArs));

  return {
    totalUsd,
    totalArs,
    pagadoUsd,
    pagadoArs,
    saldoUsd,
    saldoArs,
    completa: saldoUsd === 0 && saldoArs === 0,
  };
}

/** Fecha en que se terminó de cubrir el último saldo, incluso si se cargaron cuotas atrasadas fuera de orden. */
export function fechaCompletaCuenta(
  items: LineaCuentaImporte[],
  pagos: PagoCuentaConFecha[],
  envioArs = 0,
): Date | null {
  const saldos = calcularSaldosCuenta(items, [], envioArs);
  const fechasCierre: Date[] = [];

  for (const [moneda, total] of [['USD', saldos.totalUsd], ['ARS', saldos.totalArs]] as const) {
    if (total <= 0) continue;
    const pagosOrdenados = pagos
      .filter((pago) => pago.moneda === moneda)
      .sort((a, b) => fechaDePago(a.fecha).getTime() - fechaDePago(b.fecha).getTime());
    let acumulado = 0;
    const pagoQueCompleta = pagosOrdenados.find((pago) => {
      acumulado = redondearMoneda(acumulado + pago.monto);
      return acumulado >= total;
    });
    if (!pagoQueCompleta) return null;
    fechasCierre.push(fechaDePago(pagoQueCompleta.fecha));
  }

  if (fechasCierre.length === 0) return null;
  return new Date(Math.max(...fechasCierre.map((fecha) => fecha.getTime())));
}

function fechaDePago(fecha: Date | { toDate: () => Date }): Date {
  return fecha instanceof Date ? fecha : fecha.toDate();
}

/** Impide pagos no positivos o superiores a la deuda pendiente de su moneda. */
export function validarPagoCuenta(monto: number, moneda: MonedaCuenta, saldos: SaldosCuenta): string | null {
  if (!Number.isFinite(monto) || monto <= 0) return 'El monto del pago debe ser mayor que cero.';
  const saldo = moneda === 'USD' ? saldos.saldoUsd : saldos.saldoArs;
  if (saldo <= 0) return `La cuenta no tiene saldo pendiente en ${moneda}.`;
  if (redondearMoneda(monto) > saldo) return `El pago supera el saldo pendiente de ${moneda}.`;
  return null;
}