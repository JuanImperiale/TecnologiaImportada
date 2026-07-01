import { collection, doc, getDoc, getDocs, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { run, type Result } from './result';

/**
 * Registro de ediciones de contacto guardadas por el admin.
 * La clave es el número de teléfono normalizado (sin espacios/caracteres).
 */
interface ContactoEdicion {
  celular: string;
  nombre: string;
  editadoEn: Date;
  eliminado?: boolean;
  editadoPor?: string;
}

const col = collection(db, 'contactosAdmin');

export const contactoAdminService = {
  /** Guarda o actualiza el nombre de un contacto. */
  async saveEdicion(celular: string, nombre: string): Promise<Result<void>> {
    return run(async () => {
      const key = celular.replace(/\D/g, '');
      if (!key) throw new Error('Celular inválido');

      await setDoc(doc(col, key), {
        celular: key,
        nombre: nombre.trim(),
        editadoEn: serverTimestamp(),
      });
    });
  },

  /** Obtiene el nombre editado de un contacto (si existe). */
  async getEdicion(celular: string): Promise<Result<ContactoEdicion | null>> {
    return run(async () => {
      const key = celular.replace(/\D/g, '');
      const snap = await getDoc(doc(col, key));
      return snap.exists() ? ({ ...snap.data() } as ContactoEdicion) : null;
    });
  },

  /** Marca un contacto como eliminado. */
  async deleteContacto(celular: string): Promise<Result<void>> {
    return run(async () => {
      const key = celular.replace(/\D/g, '');
      await setDoc(doc(col, key), {
        eliminado: true,
        eliminadoEn: serverTimestamp(),
      }, { merge: true });
    });
  },

  /** Obtiene todas las ediciones de contactos guardadas. */
  async getAllEdiciones(): Promise<Result<Map<string, ContactoEdicion>>> {
    return run(async () => {
      const snap = await getDocs(col);
      const map = new Map<string, ContactoEdicion>();
      snap.forEach((doc) => {
        const data = doc.data() as ContactoEdicion;
        map.set(doc.id, data);
      });
      return map;
    });
  },
};
