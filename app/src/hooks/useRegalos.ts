import { useEffect, useState } from 'react';
import { regaloService } from '@/services/regaloService';
import type { Regalo } from '@/models';

export function useRegalos(ym: string) {
  const [regalos, setRegalos] = useState<Regalo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    return regaloService.subscribeMonth(
      ym,
      (items) => {
        setRegalos(items);
        setLoading(false);
      },
      (message) => {
        setError(message);
        setLoading(false);
      },
    );
  }, [ym]);

  return { regalos, loading, error };
}