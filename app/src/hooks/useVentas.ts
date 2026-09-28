import { useEffect, useState } from 'react';
import { saleService } from '@/services/saleService';
import type { Venta } from '@/models';

/** Suscribe al período solicitado o al histórico completo para módulos de contacto. */
export function useVentas(ym?: string) {
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    const onData = (items: Venta[]) => {
      setVentas(items);
      setLoading(false);
      setError(null);
    };
    const onError = (msg: string) => {
      setError(msg);
      setLoading(false);
    };
    const unsub = ym
      ? saleService.subscribeMonth(ym, onData, onError)
      : saleService.subscribe(
        onData,
        onError,
      );
    return unsub;
  }, [ym]);

  return { ventas, loading, error };
}
