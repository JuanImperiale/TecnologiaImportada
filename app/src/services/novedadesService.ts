import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  orderBy,
  where,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { run, type Result } from './result';
import type { Novedad } from '@/models';
import dayjs from 'dayjs';

const col = collection(db, 'novedades');

/** Calcula si una novedad está vencida. */
function isVencida(novedad: Novedad): boolean {
  if (!novedad.diasVencimiento || novedad.estado !== 'publicada') {
    return false;
  }
  const fechaVencimiento = dayjs(novedad.creado.toDate()).add(novedad.diasVencimiento, 'day');
  return dayjs().isAfter(fechaVencimiento);
}

export const novedadesService = {
  /** Suscripción a novedades activas (públicas). */
  subscribeActivas(
    onData: (items: Novedad[]) => void,
    onError: (msg: string) => void,
  ): () => void {
    const q = query(col, orderBy('orden', 'asc'));
    return onSnapshot(
      q,
      (snap) => {
        const items = snap.docs
          .map((d) => ({ id: d.id, ...(d.data() as Omit<Novedad, 'id'>) }))
          .filter((n) => n.estado === 'publicada' && !isVencida(n));
        onData(items);
      },
      (err) => {
        console.error('[novedadesService.subscribeActivas]', err);
        onError('Error al cargar novedades');
      },
    );
  },

  /** Suscripción a todas las novedades (admin). */
  subscribeAll(
    onData: (items: Novedad[]) => void,
    onError: (msg: string) => void,
  ): () => void {
    const q = query(col, orderBy('orden', 'asc'));
    return onSnapshot(
      q,
      (snap) => {
        const items = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Novedad, 'id'>) }));
        onData(items);
      },
      (err) => {
        console.error('[novedadesService.subscribeAll]', err);
        onError('Error al cargar novedades');
      },
    );
  },

  /** Crear novedad. */
  async create(data: Omit<Novedad, 'id' | 'creado' | 'actualizado'>): Promise<Result<string>> {
    return run(async () => {
      const docRef = await addDoc(col, {
        ...data,
        creado: serverTimestamp(),
        actualizado: serverTimestamp(),
      });
      return docRef.id;
    });
  },

  /** Actualizar novedad. */
  async update(id: string, data: Partial<Omit<Novedad, 'id' | 'creado'>>): Promise<Result<void>> {
    return run(async () => {
      await updateDoc(doc(db, 'novedades', id), {
        ...data,
        actualizado: serverTimestamp(),
      });
    });
  },

  /** Eliminar novedad. */
  async delete(id: string): Promise<Result<void>> {
    return run(async () => {
      await deleteDoc(doc(db, 'novedades', id));
    });
  },

  /** Obtener una novedad por ID. */
  async getById(id: string): Promise<Result<Novedad | null>> {
    return run(async () => {
      const snap = await getDocs(query(col, where('__name__', '==', id)));
      if (snap.empty) return null;
      const d = snap.docs[0];
      return { id: d.id, ...(d.data() as Omit<Novedad, 'id'>) };
    });
  },

  /** Obtener todas las novedades (admin). */
  async getAll(): Promise<Result<Novedad[]>> {
    return run(async () => {
      const snap = await getDocs(query(col, orderBy('orden', 'asc')));
      return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Novedad, 'id'>) }));
    });
  },
};
