import { monthKey } from '@/lib/utils';
import type { Venta, Gasto, Regalo } from '@/models';

type MonedaBalance = 'USD' | 'ARS';
type UnidadBalance = 'productos' | 'accesorios';

interface PorUnidad {
  productos: number;
  accesorios: number;
  total: number;
}
interface BloqueMoneda {
  ingresos: PorUnidad;
  costo: PorUnidad;
  margen: PorUnidad;
  bonifUnidades: number;
  bonifCosto: number;
}

export interface ResumenMedioPago {
  ars: number;
  usd: number;
  ventas: number;
}

interface ResumenFacturacion {
  ventas: number;
  ars: number;
  usd: number;
}

export interface BalanceMes {
  usd: BloqueMoneda;
  ars: BloqueMoneda;
  envios: number; // ARS
  /** Descuentos por pago en efectivo (ARS), ya restados de los ingresos ARS. */
  descuentosArs: number;
  /** Costo de accesorios entregados como regalos, separado de las ventas. */
  regalos: { usd: number; ars: number };
  gastos: number; // ARS
  /** Resultado neto en pesos = margen ARS + envíos − gastos. */
  netaArs: number;
  /** Resultado en dólares = margen USD (los gastos son en pesos). */
  netaUsd: number;
  ventasCount: number;
  mediosPago: Record<string, ResumenMedioPago>;
  facturacion: { facturadas: ResumenFacturacion; sinFacturar: ResumenFacturacion };
}

function vacio(): BloqueMoneda {
  return {
    ingresos: { productos: 0, accesorios: 0, total: 0 },
    costo: { productos: 0, accesorios: 0, total: 0 },
    margen: { productos: 0, accesorios: 0, total: 0 },
    bonifUnidades: 0,
    bonifCosto: 0,
  };
}

function monedaValida(value: unknown): value is MonedaBalance {
  return value === 'USD' || value === 'ARS';
}

function negocioValido(value: unknown): value is UnidadBalance {
  return value === 'productos' || value === 'accesorios';
}

function resolveMoneda(item: Partial<Venta['items'][number]>): MonedaBalance {
  return monedaValida(item.moneda) ? item.moneda : 'ARS';
}

function resolveNegocio(item: Partial<Venta['items'][number]>, venta: Venta): UnidadBalance {
  if (negocioValido(item.negocio)) return item.negocio;
  if (negocioValido(venta.negocio)) return venta.negocio;
  return 'productos';
}

/**
 * Parte (0–1) de lo vendido en USD que se cobró en pesos, y la cotización usada.
 * Si la venta no guardó cotización, se deduce de los pesos cobrados de más sobre lo vendido en pesos.
 */
export function conversionUsdAPesos(
  v: Pick<Venta, 'totalUsd' | 'totalArs' | 'envio' | 'pago'>,
): { fraccion: number; tc: number } {
  if (v.totalUsd <= 0) return { fraccion: 0, tc: 0 };
  const cobradoUsd = Math.min(Math.max(v.pago?.usd ?? 0, 0), v.totalUsd);
  const usdEnPesos = v.totalUsd - cobradoUsd;
  if (usdEnPesos <= 0) return { fraccion: 0, tc: 0 };

  let tc = v.pago?.tipoCambio ?? 0;
  if (tc <= 0) {
    const excedenteArs = (v.pago?.ars ?? 0) - (v.totalArs + (v.envio?.costo ?? 0));
    tc = excedenteArs > 0 ? excedenteArs / usdEnPesos : 0;
  }
  if (tc <= 0) return { fraccion: 0, tc: 0 };
  return { fraccion: usdEnPesos / v.totalUsd, tc };
}

/** Totales de una venta según la moneda en que realmente se cobró (ARS incluye envío). */
export function totalesCobrados(v: Venta): { usd: number; ars: number } {
  const { fraccion, tc } = conversionUsdAPesos(v);
  return {
    usd: v.totalUsd * (1 - fraccion),
    ars: v.totalArs + (v.envio?.costo ?? 0) + v.totalUsd * fraccion * tc,
  };
}

/**
 * Balance de un mes ("YYYY-MM"), separado por la moneda en que se cobró.
 * Lo vendido en USD pero cobrado en pesos pasa a pesos con la cotización de la venta.
 * Dentro de cada moneda se atribuye por unidad de negocio (por item).
 * El costo de las bonificaciones se reasigna a la unidad que cobró (misma moneda).
 */
export function computeBalance(ventas: Venta[], gastos: Gasto[], ym: string, regalos: Regalo[] = []): BalanceMes {
  const usd = vacio();
  const ars = vacio();
  let envios = 0;
  let descuentosArs = 0;
  const costoRegalos = { usd: 0, ars: 0 };
  const mediosPago: Record<string, ResumenMedioPago> = {};
  const facturacion = {
    facturadas: { ventas: 0, ars: 0, usd: 0 },
    sinFacturar: { ventas: 0, ars: 0, usd: 0 },
  };

  const ventasMes = ventas.filter((v) => v.estado === 'confirmada' && monthKey(v.creado) === ym);

  for (const v of ventasMes) {
    envios += v.envio?.costo ?? 0;

    const estadoFactura = v.facturacion?.estado === 'facturada' ? facturacion.facturadas : facturacion.sinFacturar;
    estadoFactura.ventas += 1;
    estadoFactura.ars += v.totalArs;
    estadoFactura.usd += v.totalUsd;

    const importesPorMedio = new Map<string, { ars: number; usd: number }>();
    const agregarImporteMedio = (medio: string, moneda: 'ARS' | 'USD', monto: number) => {
      const actual = importesPorMedio.get(medio) ?? { ars: 0, usd: 0 };
      actual[moneda.toLowerCase() as 'ars' | 'usd'] += monto;
      importesPorMedio.set(medio, actual);
    };

    if (v.pagosDetalle?.length) {
      for (const pago of v.pagosDetalle) {
        agregarImporteMedio(pago.moneda === 'USD' ? 'efectivo_usd' : pago.medio, pago.moneda, pago.monto);
      }
    } else {
      if (v.pago?.ars > 0) agregarImporteMedio(v.pago.medioArs || 'sin_especificar', 'ARS', v.pago.ars);
      if (v.pago?.usd > 0) agregarImporteMedio('efectivo_usd', 'USD', v.pago.usd);
    }

    for (const [medio, importes] of importesPorMedio) {
      const resumen = mediosPago[medio] ?? { ars: 0, usd: 0, ventas: 0 };
      resumen.ars += importes.ars;
      resumen.usd += importes.usd;
      resumen.ventas += 1;
      mediosPago[medio] = resumen;
    }

    // Por moneda: acumular ingresos/costo por unidad y juntar costo de bonificaciones
    const pagado: Record<MonedaBalance, { productos: number; accesorios: number }> = {
      USD: { productos: 0, accesorios: 0 },
      ARS: { productos: 0, accesorios: 0 },
    };
    const bonifPorMoneda: Record<MonedaBalance, number> = { USD: 0, ARS: 0 };
    const { fraccion, tc } = conversionUsdAPesos(v);

    const acumular = (
      moneda: MonedaBalance,
      negocio: UnidadBalance,
      bonificacion: boolean,
      ingreso: number,
      costo: number,
      unidades: number,
    ) => {
      const bloque = moneda === 'USD' ? usd : ars;
      if (bonificacion) {
        bloque.bonifUnidades += unidades;
        bloque.bonifCosto += costo;
        bonifPorMoneda[moneda] += costo;
      } else {
        bloque.ingresos[negocio] += ingreso;
        bloque.costo[negocio] += costo;
        pagado[moneda][negocio] += ingreso;
      }
    };

    for (const it of v.items ?? []) {
      const moneda = resolveMoneda(it);
      const negocio = resolveNegocio(it, v);
      const bonificacion = it.tipo === 'bonificacion';
      const costo = (it.costoUnitario ?? 0) * (it.cantidad ?? 0);
      const ingreso = bonificacion ? 0 : (it.precioUnitario ?? 0) * (it.cantidad ?? 0);
      const unidades = it.cantidad ?? 0;

      if (moneda === 'USD' && fraccion > 0) {
        const f = fraccion;
        acumular('USD', negocio, bonificacion, ingreso * (1 - f), costo * (1 - f), f < 1 ? unidades : 0);
        acumular('ARS', negocio, bonificacion, ingreso * f * tc, costo * f * tc, f < 1 ? 0 : unidades);
      } else {
        acumular(moneda, negocio, bonificacion, ingreso, costo, unidades);
      }
    }

    // Reasignar bonificaciones a la unidad cobrada, dentro de su moneda
    (['USD', 'ARS'] as const).forEach((m) => {
      const bloque = m === 'USD' ? usd : ars;
      const bonif = bonifPorMoneda[m];
      if (bonif <= 0) return;
      const totalPagado = pagado[m].productos + pagado[m].accesorios;
      if (totalPagado > 0) {
        bloque.costo.productos += bonif * (pagado[m].productos / totalPagado);
        bloque.costo.accesorios += bonif * (pagado[m].accesorios / totalPagado);
      } else {
        bloque.costo.productos += bonif;
      }
    });

    // Descuento efectivo: solo aplica a accesorios en pesos
    const descuento = v.descuento?.montoArs ?? 0;
    if (descuento > 0) {
      descuentosArs += descuento;
      ars.ingresos.accesorios -= descuento;
    }
  }

  for (const b of [usd, ars]) {
    b.ingresos.total = b.ingresos.productos + b.ingresos.accesorios;
    b.costo.total = b.costo.productos + b.costo.accesorios;
    b.margen.productos = b.ingresos.productos - b.costo.productos;
    b.margen.accesorios = b.ingresos.accesorios - b.costo.accesorios;
    b.margen.total = b.ingresos.total - b.costo.total;
  }

  const gastosTotal = gastos
    .filter((g) => monthKey(g.fecha) === ym)
    .reduce((acc, g) => acc + g.monto, 0);

  for (const regalo of regalos) {
    for (const item of regalo.items ?? []) {
      const costo = (item.costoUnitario ?? 0) * (item.cantidad ?? 0);
      if (item.moneda === 'USD') costoRegalos.usd += costo;
      else costoRegalos.ars += costo;
    }
  }

  return {
    usd,
    ars,
    envios,
    descuentosArs,
    regalos: costoRegalos,
    gastos: gastosTotal,
    netaArs: ars.margen.total + envios - gastosTotal - costoRegalos.ars,
    netaUsd: usd.margen.total - costoRegalos.usd,
    ventasCount: ventasMes.length,
    mediosPago,
    facturacion,
  };
}
