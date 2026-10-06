import type { EstadoFacturacion } from '@/models';

export type FiltroFacturacion = 'todas' | 'facturada' | 'sin_facturar';

export function coincideFiltroFacturacion(
  estado: EstadoFacturacion | undefined,
  filtro: FiltroFacturacion,
): boolean {
  if (filtro === 'todas') return true;
  if (filtro === 'facturada') return estado === 'facturada';
  return estado !== 'facturada';
}