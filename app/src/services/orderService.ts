import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { run, type Result } from './result';
import { formatPrice, formatMoney, formatUsd } from '@/lib/utils';
import type { ItemCarrito } from '@/models';

interface Totales {
  usd: number;
  ars: number;
}

interface CrearPedidoInput {
  nombre: string;
  celular: string;
  items: ItemCarrito[];
  totals: Totales;
}

function lineasTotales(totals: Totales): string[] {
  const out: string[] = [];
  if (totals.usd > 0) out.push(`Total en dólares: ${formatUsd(totals.usd)}`);
  if (totals.ars > 0) out.push(`Total en pesos: ${formatMoney(totals.ars)}`);
  return out;
}

export const orderService = {
  /** Crea la consulta (lead) en Firestore con estado 'nuevo'. */
  crearPedido({ nombre, celular, items, totals }: CrearPedidoInput): Promise<Result<string>> {
    return run(async () => {
      const contactoId = celular.replace(/\D/g, '');
      if (!contactoId) throw new Error('Celular inválido');

      const docRef = await addDoc(collection(db, 'pedidos'), {
        nombre: nombre.trim(),
        celular: celular.trim(),
        contactoId,
        items: items.map((i) => ({
          productId: i.productId,
          nombre: i.nombre,
          negocio: i.negocio,
          cantidad: i.cantidad,
          precioUnitario: i.precioUnitario,
          monedaVenta: i.monedaVenta,
          precioMostrado: i.precioMostrado,
        })),
        totalUsd: totals.usd,
        totalArs: totals.ars,
        estado: 'nuevo',
        creado: serverTimestamp(),
      });
      return docRef.id;
    });
  },

  /** Arma el link de WhatsApp con el detalle del pedido. */
  buildWhatsappUrl(phone: string, nombre: string, items: ItemCarrito[], totals: Totales): string {
    const lineas = items
      .map((i) => `• ${i.cantidad}x ${i.nombre} — ${formatPrice(i.precioMostrado, i.monedaVenta)}`)
      .join('\n');
    const texto =
      `¡Hola! Soy ${nombre}. Quiero consultar por estos productos:\n\n` +
      `${lineas}\n\n` +
      lineasTotales(totals).join('\n');
    return `https://wa.me/${phone}?text=${encodeURIComponent(texto)}`;
  },
};
