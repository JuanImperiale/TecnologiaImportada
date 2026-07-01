import { useEffect, useMemo, useState } from 'react';
import { pedidoService } from '@/services/pedidoService';
import type { Pedido } from '@/models';

/** Suscribe en vivo a las consultas (pedidos) y calcula los pendientes. */
export function usePedidos() {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsub = pedidoService.subscribe(
      (items) => {
        setPedidos(items);
        setLoading(false);
      },
      (msg) => {
        setError(msg);
        setLoading(false);
      },
    );
    return unsub;
  }, []);

  // Pendientes = no atendidos ni descartados
  const pendientes = useMemo(
    () => pedidos.filter((p) => p.estado !== 'atendido' && p.estado !== 'descartado').length,
    [pedidos],
  );

  return { pedidos, pendientes, loading, error };
}
