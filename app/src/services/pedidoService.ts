import { collection, deleteDoc, doc, getDocs, limit, onSnapshot, orderBy, query, serverTimestamp, updateDoc } from 'firebase/firestore';
import { where } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { run, type Result } from './result';
import type { Pedido, EstadoPedido } from '@/models';

const col = collection(db, 'pedidos');

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
    });
  },

  /** Elimina una consulta de forma permanente. */
  remove(id: string): Promise<Result<void>> {
    return run(async () => {
      await deleteDoc(doc(db, 'pedidos', id));
    });
  },

  /** Suscripción a pedidos pendientes. */
  subscribePendientes(onData: (items: Pedido[]) => void, onError: (msg: string) => void): () => void {
    const q = query(col, where('estado', 'in', ['nuevo', 'visto']));
    return onSnapshot(
      q,
      (snap) => onData(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Pedido, 'id'>) }))),
      (err) => {
        console.error('[pedidoService.subscribePendientes]', err);
        onError('No se pudo actualizar el contador de consultas pendientes.');
      },
    );
  },

  subscribeEstado(filtro: 'pendientes' | 'atendidos', onData: (items: Pedido[]) => void, onError: (msg: string) => void): () => void {
    const q = filtro === 'pendientes'
      ? query(col, where('estado', 'in', ['nuevo', 'visto']))
      : query(col, where('estado', '==', 'atendido'));
    return onSnapshot(
      q,
      (snap) => {
        const items = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Pedido, 'id'>) }));
        items.sort((a, b) => b.creado.toMillis() - a.creado.toMillis());
        onData(items);
      },
      (err) => {
        console.error('[pedidoService.subscribeEstado]', err);
        onError('No se pudieron cargar las notificaciones.');
      },
    );
  },

  async getRecent(pageSize = 50): Promise<Result<Pedido[]>> {
    return run(async () => {
      const snap = await getDocs(query(col, orderBy('creado', 'desc'), limit(Math.max(1, Math.min(pageSize, 100)))));
      return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Pedido, 'id'>) }));
    });
  },
};
