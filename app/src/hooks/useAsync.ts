import { useCallback, useEffect, useRef, useState } from 'react';
import type { Result } from '@/services/result';

interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

/**
 * Ejecuta una función que devuelve Result<T> y expone {data, loading, error}.
 * Pensado para consumir services en componentes sin repetir try/catch.
 *
 * @param fn      función async que devuelve Result<T>
 * @param options immediate: ejecutar al montar (default true)
 */
export function useAsync<T>(
  fn: () => Promise<Result<T>>,
  options: { immediate?: boolean } = {},
) {
  const { immediate = true } = options;
  const [state, setState] = useState<AsyncState<T>>({
    data: null,
    loading: immediate,
    error: null,
  });

  // Mantiene la referencia más reciente sin re-disparar el efecto
  const fnRef = useRef(fn);
  fnRef.current = fn;

  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const execute = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }));
    const result = await fnRef.current();
    if (!mounted.current) return result;
    if (result.ok) {
      setState({ data: result.data, loading: false, error: null });
    } else {
      setState({ data: null, loading: false, error: result.error.message });
    }
    return result;
  }, []);

  useEffect(() => {
    if (immediate) void execute();
  }, [immediate, execute]);

  return { ...state, execute, setData: (data: T) => setState((s) => ({ ...s, data })) };
}
