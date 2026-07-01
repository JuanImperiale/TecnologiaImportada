import { useEffect, useState } from 'react';
import { gastoService } from '@/services/gastoService';
import type { Gasto } from '@/models';

/** Suscribe en vivo a todos los gastos (se filtran por mes en la vista). */
export function useGastos() {
  const [gastos, setGastos] = useState<Gasto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsub = gastoService.subscribe(
      (items) => {
        setGastos(items);
        setLoading(false);
      },
      (msg) => {
        setError(msg);
        setLoading(false);
      },
    );
    return unsub;
  }, []);

  return { gastos, loading, error };
}
