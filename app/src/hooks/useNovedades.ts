import { useEffect, useState } from 'react';
import { novedadesService } from '@/services/novedadesService';
import type { Novedad } from '@/models';

/** Hook para obtener novedades activas (públicas). */
export function useNovedades() {
  const [novedades, loading, error] = useNovedadesData();
  return { novedades, loading, error };
}

/** Hook para obtener novedades destacadas (para popup). */
export function useNovedadesDestacadas() {
  const [novedades, loading, error] = useNovedadesData();
  const destacadas = novedades.filter((n) => n.destacado);
  return { novedades: destacadas, loading, error };
}

/** Hook para obtener todas las novedades (admin). */
export function useNovedadesAdmin() {
  const [novedades, setNovedades] = useState<Novedad[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    const unsub = novedadesService.subscribeAll(
      (items) => {
        setNovedades(items);
        setLoading(false);
        setError(null);
      },
      (err) => {
        setError(err);
        setLoading(false);
      },
    );

    return unsub;
  }, []);

  return { novedades, loading, error };
}

/** Hook interno para datos de novedades activas. */
function useNovedadesData() {
  const [novedades, setNovedades] = useState<Novedad[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    const unsub = novedadesService.subscribeActivas(
      (items) => {
        setNovedades(items);
        setLoading(false);
        setError(null);
      },
      (err) => {
        setError(err);
        setLoading(false);
      },
    );

    return unsub;
  }, []);

  return [novedades, loading, error] as const;
}
