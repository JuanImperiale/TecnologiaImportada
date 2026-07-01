import { monthKey } from '@/lib/utils';
import type { Venta, Gasto } from '@/models';

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

export interface BalanceMes {
  usd: BloqueMoneda;
  ars: BloqueMoneda;
  envios: number; // ARS
  gastos: number; // ARS
  /** Resultado neto en pesos = margen ARS + envíos − gastos. */
  netaArs: number;
  /** Resultado en dólares = margen USD (los gastos son en pesos). */
  netaUsd: number;
  ventasCount: number;
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
 * Balance de un mes ("YYYY-MM"), separado por moneda (USD / ARS), sin conversión.
 * Dentro de cada moneda se atribuye por unidad de negocio (por item).
 * El costo de las bonificaciones se reasigna a la unidad que cobró (misma moneda).
 */
export function computeBalance(ventas: Venta[], gastos: Gasto[], ym: string): BalanceMes {
  const usd = vacio();
  const ars = vacio();
  let envios = 0;

  const ventasMes = ventas.filter((v) => v.estado === 'confirmada' && monthKey(v.creado) === ym);

  for (const v of ventasMes) {
    envios += v.envio?.costo ?? 0;

    // Por moneda: acumular ingresos/costo por unidad y juntar costo de bonificaciones
    const pagado: Record<MonedaBalance, { productos: number; accesorios: number }> = {
      USD: { productos: 0, accesorios: 0 },
      ARS: { productos: 0, accesorios: 0 },
    };
    const bonifPorMoneda: Record<MonedaBalance, number> = { USD: 0, ARS: 0 };

    for (const it of v.items ?? []) {
      const moneda = resolveMoneda(it);
      const negocio = resolveNegocio(it, v);
      const bloque = moneda === 'USD' ? usd : ars;
      const costo = (it.costoUnitario ?? 0) * (it.cantidad ?? 0);
      if (it.tipo === 'bonificacion') {
        bloque.bonifUnidades += it.cantidad;
        bloque.bonifCosto += costo;
        bonifPorMoneda[moneda] += costo;
      } else {
        const ingreso = (it.precioUnitario ?? 0) * (it.cantidad ?? 0);
        bloque.ingresos[negocio] += ingreso;
        bloque.costo[negocio] += costo;
        pagado[moneda][negocio] += ingreso;
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

  return {
    usd,
    ars,
    envios,
    gastos: gastosTotal,
    netaArs: ars.margen.total + envios - gastosTotal,
    netaUsd: usd.margen.total,
    ventasCount: ventasMes.length,
  };
}
