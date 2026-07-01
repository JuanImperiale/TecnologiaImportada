import { useEffect, useState } from 'react';
import { saleService } from '@/services/saleService';
import type { Venta } from '@/models';

/** Suscribe en vivo a las ventas (más nuevas primero). */
export function useVentas() {
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsub = saleService.subscribe(
      (items) => {
        setVentas(items);
        setLoading(false);
      },
      (msg) => {
        setError(msg);
        setLoading(false);
      },
    );
    return unsub;
  }, []);

  return { ventas, loading, error };
}
