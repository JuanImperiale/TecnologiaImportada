import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { run, type Result } from './result';
import { slugify } from '@/lib/utils';
import type { Categoria, Negocio } from '@/models';

const col = collection(db, 'categories');

export const categoryService = {
  /** Suscripción en vivo a las categorías de una unidad. Devuelve unsubscribe. */
  subscribe(
    negocio: Negocio,
    onData: (cats: Categoria[]) => void,
    onError: (msg: string) => void,
  ): () => void {
    const q = query(col, where('negocio', '==', negocio));
    return onSnapshot(
      q,
      (snap) => {
        const cats = snap.docs
          .map((d) => ({ id: d.id, ...(d.data() as Omit<Categoria, 'id'>) }))
          .sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0) || a.nombre.localeCompare(b.nombre));
        onData(cats);
      },
      (err) => {
        console.error('[categoryService]', err);
        onError('No se pudieron cargar las categorías.');
      },
    );
  },

  create(negocio: Negocio, nombre: string, orden = 0): Promise<Result<string>> {
    return run(async () => {
      const docRef = await addDoc(col, { nombre: nombre.trim(), slug: slugify(nombre), negocio, orden });
      return docRef.id;
    });
  },

  update(id: string, data: Partial<Pick<Categoria, 'nombre' | 'orden'>>, _oldNombre?: string): Promise<Result<void>> {
    return run(async () => {
      const patch: Record<string, unknown> = { ...data };
      if (data.nombre) patch.slug = slugify(data.nombre);
      await updateDoc(doc(db, 'categories', id), patch);
    });
  },

  remove(id: string): Promise<Result<void>> {
    return run(async () => {
      await deleteDoc(doc(db, 'categories', id));
    });
  },

  /** Suscripción en vivo a todas las categorías (ambas unidades). */
  subscribeAll(
    onData: (cats: Categoria[]) => void,
    onError: (msg: string) => void,
  ): () => void {
    return onSnapshot(
      col,
      (snap) => {
        const cats = snap.docs
          .map((d) => ({ id: d.id, ...(d.data() as Omit<Categoria, 'id'>) }))
          .sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0) || a.nombre.localeCompare(b.nombre));
        onData(cats);
      },
      (err) => {
        console.error('[categoryService]', err);
        onError('No se pudieron cargar las categorías.');
      },
    );
  },
};
