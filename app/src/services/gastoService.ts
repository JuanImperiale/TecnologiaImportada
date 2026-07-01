import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  Timestamp,
  updateDoc,
} from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { run, type Result } from './result';
import type { Gasto, CategoriaGasto } from '@/models';

const col = collection(db, 'gastos');

export interface GastoInput {
  concepto: string;
  categoria: CategoriaGasto;
  monto: number;
  fecha: Date;
  recurrente: boolean;
  nota?: string;
}

export const gastoService = {
  subscribe(onData: (items: Gasto[]) => void, onError: (msg: string) => void): () => void {
    const q = query(col, orderBy('fecha', 'desc'));
    return onSnapshot(
      q,
      (snap) => onData(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Gasto, 'id'>) }))),
      (err) => {
        console.error('[gastoService]', err);
        onError('No se pudieron cargar los gastos.');
      },
    );
  },

  create(input: GastoInput): Promise<Result<string>> {
    return run(async () => {
      const ref = await addDoc(col, {
        concepto: input.concepto.trim(),
        categoria: input.categoria,
        monto: input.monto,
        fecha: Timestamp.fromDate(input.fecha),
        recurrente: input.recurrente,
        nota: input.nota ?? '',
        creadoPor: auth.currentUser?.email ?? '',
      });
      return ref.id;
    });
  },

  remove(id: string): Promise<Result<void>> {
    return run(async () => {
      await deleteDoc(doc(db, 'gastos', id));
    });
  },

  update(id: string, patch: Partial<GastoInput>): Promise<Result<void>> {
    return run(async () => {
      const data: Record<string, unknown> = { ...patch };
      if (patch.fecha) data.fecha = Timestamp.fromDate(patch.fecha);
      await updateDoc(doc(db, 'gastos', id), data);
    });
  },

  /** Crea copias de una lista de gastos recurrentes con la fecha indicada. */
  clonar(gastos: Gasto[], fecha: Date): Promise<Result<number>> {
    return run(async () => {
      for (const g of gastos) {
        await addDoc(col, {
          concepto: g.concepto,
          categoria: g.categoria,
          monto: g.monto,
          fecha: Timestamp.fromDate(fecha),
          recurrente: true,
          nota: g.nota ?? '',
          creadoPor: auth.currentUser?.email ?? '',
        });
      }
      return gastos.length;
    });
  },
};
