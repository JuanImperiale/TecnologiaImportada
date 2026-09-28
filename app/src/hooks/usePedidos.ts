import { useEffect, useMemo, useState } from 'react';
import { pedidoService } from '@/services/pedidoService';
import type { Pedido } from '@/models';

/** Suscribe en vivo a las consultas (pedidos) y calcula los pendientes. */
export function usePedidos(filtro?: 'pendientes' | 'atendidos' | 'todos') {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    const onData = (items: Pedido[]) => {
      setPedidos(items);
      setLoading(false);
      setError(null);
    };
    const onError = (msg: string) => {
      setError(msg);
      setLoading(false);
    };
    const unsub = filtro && filtro !== 'todos'
      ? pedidoService.subscribeEstado(filtro, onData, onError)
      : pedidoService.subscribe(
        onData,
        onError,
    );
    return unsub;
  }, [filtro]);

  // Pendientes = no atendidos ni descartados
  const pendientes = useMemo(
    () => pedidos.filter((p) => p.estado !== 'atendido' && p.estado !== 'descartado').length,
    [pedidos],
  );

  return { pedidos, pendientes, loading, error };
}

/** Mantiene actualizado solo el conteo de consultas que requieren atención. */
export function usePedidosPendientes(): number {
  const [pendientes, setPendientes] = useState(0);

  useEffect(() => pedidoService.subscribePendientes((items) => setPendientes(items.length), () => {}), []);

  return pendientes;
}
