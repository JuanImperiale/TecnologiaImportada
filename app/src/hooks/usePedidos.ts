import { useEffect, useMemo, useState } from 'react';
import { pedidoService } from '@/services/pedidoService';
import type { Pedido } from '@/models';

/** Suscribe en vivo a las consultas (pedidos) y calcula los pendientes. */
export function usePedidos(enabled = true) {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) {
      setPedidos([]);
      setLoading(false);
      setError(null);
      return;
    }
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
    const unsub = pedidoService.subscribe(onData, onError);
    return unsub;
  }, [enabled]);

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

  useEffect(() => {
    const actualizar = () => {
      void pedidoService.getPendientesCount().then((result) => {
        if (result.ok) setPendientes(result.data);
      });
    };
    actualizar();
    window.addEventListener('focus', actualizar);
    window.addEventListener('ti:pending-orders-updated', actualizar);
    return () => {
      window.removeEventListener('focus', actualizar);
      window.removeEventListener('ti:pending-orders-updated', actualizar);
    };
  }, []);

  return pendientes;
}
