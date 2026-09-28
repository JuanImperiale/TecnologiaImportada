import { useEffect, useState } from 'react';
import { gastoService } from '@/services/gastoService';
import type { Gasto } from '@/models';

/** Suscribe solo al mes solicitado o al histórico completo si no se indica período. */
export function useGastos(ym?: string) {
  const [gastos, setGastos] = useState<Gasto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    const onData = (items: Gasto[]) => {
      setGastos(items);
      setLoading(false);
      setError(null);
    };
    const onError = (msg: string) => {
      setError(msg);
      setLoading(false);
    };
    const unsub = ym
      ? gastoService.subscribeMonth(ym, onData, onError)
      : gastoService.subscribe(onData, onError);
    return unsub;
  }, [ym]);

  return { gastos, loading, error };
}
