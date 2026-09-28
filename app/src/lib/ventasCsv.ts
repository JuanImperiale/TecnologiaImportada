import { formatDate, monthKey } from '@/lib/utils';
import { medioPagoLabel } from '@/lib/mediosPago';
import type { Venta } from '@/models';

const COLUMNAS = [
  'N° venta',
  'Fecha',
  'Estado',
  'Canal',
  'Unidad de negocio',
  'Cliente',
  'Celular',
  'CUIT/DNI',
  'ID producto',
  'Producto',
  'Tipo de línea',
  'Cantidad',
  'Moneda',
  'Precio unitario',
  'Total de línea',
  'Costo unitario',
  'Costo de línea',
  'Total venta USD',
  'Total venta ARS',
  'Descuento %',
  'Descuento ARS',
  'Entrega',
  'Envío ARS',
  'Cobrado USD',
  'Cobrado ARS',
  'Medio de pago ARS',
  'Cotización USD a ARS',
  'Estado de facturación',
  'Tipo de factura',
  'N° Factura C',
  'CAE',
  'Vendedor',
  'ID pedido',
  'ID cuenta por cobrar',
  'Detalle pagos parciales',
];

function csvCelda(value: unknown): string {
  return `"${String(value ?? '').replace(/"/g, '""')}"`;
}

/** Genera una fila por artículo y repite los datos de la venta para filtrar en hojas de cálculo. */
export function exportarVentasCsv(ventas: Venta[], periodo: string): string {
  const ventasDelPeriodo = ventas.filter((venta) => monthKey(venta.creado) === periodo);
  const filas = ventasDelPeriodo.flatMap((venta) => {
    const lineas = venta.items?.length ? venta.items : [undefined];
    return lineas.map((item) => [
      venta.numero,
      formatDate((venta.creado as unknown as { toDate?: () => Date })?.toDate?.() ?? new Date(), 'DD/MM/YYYY HH:mm'),
      venta.estado,
      venta.canal,
      venta.negocio,
      venta.cliente?.nombre,
      venta.cliente?.celular,
      venta.cliente?.cuitDni,
      item?.productId,
      item?.nombre,
      item?.tipo,
      item?.cantidad,
      item?.moneda,
      item?.precioUnitario,
      item ? (item.tipo === 'bonificacion' ? 0 : item.precioUnitario * item.cantidad) : '',
      item?.costoUnitario,
      item ? item.costoUnitario * item.cantidad : '',
      venta.totalUsd,
      venta.totalArs,
      venta.descuento?.porcentaje,
      venta.descuento?.montoArs,
      venta.envio?.metodo,
      venta.envio?.costo,
      venta.pago?.usd,
      venta.pago?.ars,
      medioPagoLabel(venta.pago?.medioArs),
      venta.pago?.tipoCambio,
      venta.facturacion?.estado,
      venta.facturacion?.tipo,
      venta.facturacion?.nroFacturaC,
      venta.facturacion?.cae,
      venta.vendedorId,
      venta.pedidoId,
      venta.cuentaCobrarId,
      venta.pagosDetalle?.map((pago) =>
        `${formatDate(pago.fecha.toDate(), 'DD/MM/YYYY')} ${pago.moneda} ${pago.monto} ${medioPagoLabel(pago.medio)} (${pago.registradoPor})`,
      ).join(' | '),
    ]);
  });

  return `\uFEFF${[COLUMNAS, ...filas].map((fila) => fila.map(csvCelda).join(';')).join('\r\n')}`;
}