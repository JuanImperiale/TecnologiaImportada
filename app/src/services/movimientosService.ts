import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import type { TipoMovimiento } from '@/models';

/**
 * Registra un movimiento de stock (kardex). Best-effort: si falla, loguea
 * pero no rompe la operación principal (alta/edición/venta).
 */
export async function registrarMovimiento(
  productId: string,
  tipo: TipoMovimiento,
  cantidad: number,
  motivo?: string,
): Promise<void> {
  try {
    await addDoc(collection(db, 'movimientosStock'), {
      productId,
      tipo,
      cantidad,
      motivo: motivo ?? '',
      usuario: auth.currentUser?.email ?? auth.currentUser?.uid ?? 'desconocido',
      fecha: serverTimestamp(),
    });
  } catch (error) {
    console.warn('[movimientosService] no se pudo registrar el movimiento', error);
  }
}
