import {
  collection,
  deleteDoc,
  doc,
  getCountFromServer,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  startAfter,
  updateDoc,
  where,
  type DocumentData,
  type QueryConstraint,
  type QueryDocumentSnapshot,
} from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { run, type Result } from './result';
import type { Pedido, EstadoPedido } from '@/models';

const col = collection(db, 'pedidos');

export type PedidoCursor = QueryDocumentSnapshot<DocumentData>;

export interface PedidoPage {
  pedidos: Pedido[];
  cursor: PedidoCursor | null;
  hasMore: boolean;
}

export const pedidoService = {
  /** Suscripción en vivo a las consultas, más nuevas primero. Devuelve unsubscribe. */
  subscribe(onData: (items: Pedido[]) => void, onError: (msg: string) => void): () => void {
    const q = query(col, orderBy('creado', 'desc'));
    return onSnapshot(
      q,
      (snap) => onData(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Pedido, 'id'>) }))),
      (err) => {
        console.error('[pedidoService]', err);
        onError('No se pudieron cargar las notificaciones.');
      },
    );
  },

  /** Cambia el estado de una consulta. Al atender, registra quién y cuándo. */
  setEstado(id: string, estado: EstadoPedido): Promise<Result<void>> {
    return run(async () => {
      const patch: Record<string, unknown> = { estado };
      if (estado === 'atendido') {
        patch.atendidoPor = auth.currentUser?.email ?? auth.currentUser?.uid ?? '';
        patch.atendidoEn = serverTimestamp();
      }
      await updateDoc(doc(db, 'pedidos', id), patch);
      window.dispatchEvent(new Event('ti:pending-orders-updated'));
    });
  },

  /** Elimina una consulta de forma permanente. */
  remove(id: string): Promise<Result<void>> {
    return run(async () => {
      await deleteDoc(doc(db, 'pedidos', id));
      window.dispatchEvent(new Event('ti:pending-orders-updated'));
    });
  },

  getPendientesCount(): Promise<Result<number>> {
    return run(async () => {
      const snapshot = await getCountFromServer(query(col, where('estado', 'in', ['nuevo', 'visto'])));
      return snapshot.data().count;
    });
  },

  getPage(filtro: 'pendientes' | 'atendidos' | 'todos', pageSize = 30, cursor?: PedidoCursor | null): Promise<Result<PedidoPage>> {
    return run(async () => {
      const constraints: QueryConstraint[] = [];
      if (filtro === 'pendientes') constraints.push(where('estado', 'in', ['nuevo', 'visto']));
      if (filtro === 'atendidos') constraints.push(where('estado', '==', 'atendido'));
      constraints.push(orderBy('creado', 'desc'));
      if (cursor) constraints.push(startAfter(cursor));
      const size = Math.max(1, Math.min(pageSize, 100));
      constraints.push(limit(size));
      const snapshot = await getDocs(query(col, ...constraints));
      return {
        pedidos: snapshot.docs.map((item) => ({ id: item.id, ...(item.data() as Omit<Pedido, 'id'>) })),
        cursor: snapshot.docs[snapshot.docs.length - 1] ?? null,
        hasMore: snapshot.docs.length === size,
      };
    });
  },

};
