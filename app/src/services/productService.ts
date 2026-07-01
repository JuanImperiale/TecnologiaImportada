import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
  limit,
  getDocs,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { run, type Result } from './result';
import { registrarMovimiento } from './movimientosService';
import { slugify } from '@/lib/utils';
import type { Producto, Negocio } from '@/models';
import type { ProductoForm } from '@/schemas';

// El producto vive en una sola moneda (monedaVenta); costo y precio NO se convierten.
export type ProductoInput = ProductoForm & { imagenes: string[] };

const col = collection(db, 'products');
export const PUBLIC_PRODUCTS_CACHE_KEY = 'ti_public_products_cache_v1';

/** Quita claves con valor undefined (Firestore no las acepta). */
function clean<T extends Record<string, unknown>>(obj: T): T {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined)) as T;
}

export const productService = {
  /** Suscripción en vivo a los productos de una unidad. Devuelve unsubscribe. */
  subscribe(
    negocio: Negocio,
    onData: (items: Producto[]) => void,
    onError: (msg: string) => void,
  ): () => void {
    const q = query(col, where('negocio', '==', negocio));
    return onSnapshot(
      q,
      (snap) => {
        const items = snap.docs
          .map((d) => ({ id: d.id, ...(d.data() as Omit<Producto, 'id'>) }))
          .sort((a, b) => a.nombre.localeCompare(b.nombre));
        onData(items);
      },
      (err) => {
        console.error('[productService]', err);
        onError('No se pudieron cargar los productos.');
      },
    );
  },

  async get(id: string): Promise<Result<Producto | null>> {
    return run(async () => {
      const snap = await getDoc(doc(db, 'products', id));
      return snap.exists() ? ({ id: snap.id, ...(snap.data() as Omit<Producto, 'id'>) }) : null;
    });
  },

  /** Suscripción pública: solo productos activos (de ambas unidades). */
  subscribeActive(onData: (items: Producto[]) => void, onError: (msg: string) => void): () => void {
    const q = query(col, where('activo', '==', true));
    return onSnapshot(
      q,
      (snap) => {
        const items = snap.docs
          .map((d) => ({ id: d.id, ...(d.data() as Omit<Producto, 'id'>) }))
          .sort((a, b) => a.nombre.localeCompare(b.nombre));
        try {
          localStorage.setItem(PUBLIC_PRODUCTS_CACHE_KEY, JSON.stringify(items));
        } catch {
          // no-op: si storage está lleno o bloqueado, seguimos sin cache.
        }
        onData(items);
      },
      (err) => {
        console.error('[productService]', err);
        onError('No se pudieron cargar los productos.');
      },
    );
  },

  /** Lee productos públicos desde cache local (si existe). */
  getCachedActive(): Producto[] {
    try {
      const raw = localStorage.getItem(PUBLIC_PRODUCTS_CACHE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw) as Producto[];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  },

  /** Fallback rápido: trae una ventana inicial de productos públicos. */
  async getActiveFirstPage(pageSize = 24): Promise<Result<Producto[]>> {
    return run(async () => {
      const q = query(col, where('activo', '==', true), limit(pageSize));
      const snap = await getDocs(q);
      return snap.docs
        .map((d) => ({ id: d.id, ...(d.data() as Omit<Producto, 'id'>) }))
        .sort((a, b) => a.nombre.localeCompare(b.nombre));
    });
  },


  create(data: ProductoInput): Promise<Result<string>> {
    return run(async () => {
      const payload = clean({
        ...data,
        slug: slugify(data.nombre),
        creado: serverTimestamp(),
        actualizado: serverTimestamp(),
      });
      const docRef = await addDoc(col, payload);
      if (data.stock > 0) {
        await registrarMovimiento(docRef.id, 'ingreso', data.stock, 'Alta de producto');
      }
      return docRef.id;
    });
  },

  update(id: string, data: ProductoInput): Promise<Result<void>> {
    return run(async () => {
      const prev = await getDoc(doc(db, 'products', id));
      const stockAnterior = prev.exists() ? ((prev.data() as Producto).stock ?? 0) : 0;

      await updateDoc(
        doc(db, 'products', id),
        clean({ ...data, slug: slugify(data.nombre), actualizado: serverTimestamp() }),
      );

      const diff = data.stock - stockAnterior;
      if (diff !== 0) {
        await registrarMovimiento(id, 'ajuste', Math.abs(diff), `Ajuste manual (${diff > 0 ? '+' : ''}${diff})`);
      }
    });
  },

  /** Desactiva/activa (visibilidad en la tienda) sin borrar el documento. */
  setActivo(id: string, activo: boolean): Promise<Result<void>> {
    return run(async () => {
      await updateDoc(doc(db, 'products', id), { activo, actualizado: serverTimestamp() });
    });
  },

  /**
   * Borra el producto definitivamente. Las ventas guardan snapshot propio, así
   * que el historial no se rompe. Devuelve las URLs de imágenes que quedaron
   * (para intentar limpiarlas en Cloudinary).
   */
  remove(id: string): Promise<Result<string[]>> {
    return run(async () => {
      const snap = await getDoc(doc(db, 'products', id));
      const imagenes = snap.exists() ? ((snap.data() as Producto).imagenes ?? []) : [];
      await deleteDoc(doc(db, 'products', id));
      return imagenes;
    });
  },
};
