import { addDoc, collection, doc, getDocs, increment, limit, orderBy, query, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { run, type Result } from './result';
import { registrarMovimiento } from './movimientosService';
import type { Timestamp } from 'firebase/firestore';

export type MonedaImportacion = 'ARS' | 'USD';

export interface LoteItemInput {
  productId: string;
  nombre: string;
  cantidad: number;
  moneda: MonedaImportacion;
  /** Costo nuevo (en la moneda del producto). Si se indica, actualiza el costo del producto. */
  costo?: number;
}

export interface LoteInput {
  proveedor: string;
  fecha: Date;
  nota?: string;
  items: LoteItemInput[];
}

export interface LoteImportado {
  id: string;
  proveedor: string;
  fecha: Timestamp | Date;
  items: {
    productId: string;
    nombre: string;
    cantidad: number;
    costo: number;
    moneda?: MonedaImportacion;
  }[];
}

export const importService = {
  /** Registra un lote: suma stock a cada producto, actualiza costo (opcional) y deja movimientos. */
  crearLote(input: LoteInput): Promise<Result<string>> {
    return run(async () => {
      // 1) Actualizar stock (y costo) de cada producto
      for (const it of input.items) {
        const patch: Record<string, unknown> = { stock: increment(it.cantidad) };
        if (typeof it.costo === 'number' && it.costo >= 0) patch.costo = it.costo;
        await updateDoc(doc(db, 'products', it.productId), patch);
        await registrarMovimiento(it.productId, 'ingreso', it.cantidad, `Lote: ${input.proveedor}`);
      }
      // 2) Guardar el lote
      const ref = await addDoc(collection(db, 'importBatches'), {
        proveedor: input.proveedor.trim(),
        fecha: input.fecha,
        nota: input.nota ?? '',
        items: input.items,
        creadoPor: auth.currentUser?.email ?? '',
        creado: serverTimestamp(),
      });
      return ref.id;
    });
  },

  getRecentBatches(pageSize = 20): Promise<Result<LoteImportado[]>> {
    return run(async () => {
      const snapshot = await getDocs(query(
        collection(db, 'importBatches'),
        orderBy('fecha', 'desc'),
        limit(Math.max(1, Math.min(pageSize, 100))),
      ));
      return snapshot.docs.map((item) => ({
        id: item.id,
        ...(item.data() as Omit<LoteImportado, 'id'>),
      }));
    });
  },
};
