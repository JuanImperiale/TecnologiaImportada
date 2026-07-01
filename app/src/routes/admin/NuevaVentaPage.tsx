import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { ArrowLeft, Search, Trash2, Gift, ShoppingBag } from 'lucide-react';
import { useCatalog } from '@/hooks/useCatalog';
import { saleService } from '@/services/saleService';
import { DEFAULT_MEDIOS_PAGO, settingsService } from '@/services/settingsService';
import { Card, CardBody } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { ClienteSelector } from '@/components/admin/ClienteSelector';
import { cn, formatMoney, formatUsd } from '@/lib/utils';
import type { ItemVenta, MedioPago, Pedido, Producto } from '@/models';

interface Linea extends ItemVenta {
  stock: number;
}

const MEDIOS_ARS: { value: MedioPago; label: string }[] = [
  { value: 'efectivo', label: 'Efectivo' },
  { value: 'transferencia', label: 'Transferencia' },
  { value: 'tarjeta', label: 'Tarjeta' },
  { value: 'qr', label: 'QR / Mercado Pago' },
];

export function NuevaVentaPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const pedido = (location.state as { pedido?: Pedido } | null)?.pedido;
  const { all } = useCatalog();

  const [lineas, setLineas] = useState<Linea[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [metodoEnvio, setMetodoEnvio] = useState<'retiro' | 'envio'>('retiro');
  const [costoEnvio, setCostoEnvio] = useState(0);
  const [tipoCambio, setTipoCambio] = useState('');
  const [pagoUsd, setPagoUsd] = useState('');
  const [pagoArs, setPagoArs] = useState('');
  const [medioArs, setMedioArs] = useState<MedioPago>('efectivo');
  const [mediosPago, setMediosPago] = useState<MedioPago[]>(DEFAULT_MEDIOS_PAGO);
  const [recargoTarjeta, setRecargoTarjeta] = useState(0);
  const [cliente, setCliente] = useState<{ nombre: string; celular: string; cuitDni?: string }>({ nombre: '', celular: '', cuitDni: '' });
  const [guardando, setGuardando] = useState(false);

  const lineaDeProducto = (p: Producto): Linea => ({
    productId: p.id,
    nombre: p.nombre,
    negocio: p.negocio,
    moneda: p.monedaVenta ?? 'ARS',
    tipo: 'venta',
    cantidad: 1,
    precioUnitario: p.precioVenta,
    costoUnitario: p.costo,
    stock: p.stock,
  });

  const agregar = (p: Producto) => {
    setLineas((prev) => (prev.some((l) => l.productId === p.id) ? prev : [...prev, lineaDeProducto(p)]));
    setBusqueda('');
  };

  useEffect(() => {
    if (!pedido || all.length === 0 || lineas.length > 0) return;
    const nuevas: Linea[] = [];
    for (const it of pedido.items) {
      const p = all.find((x) => x.id === it.productId);
      if (p) {
        nuevas.push({
          ...lineaDeProducto(p),
          nombre: it.nombre,
          cantidad: it.cantidad,
          moneda: it.monedaVenta,
          // El pedido debe conservar el precio que vio el cliente al confirmar.
          precioUnitario: it.precioMostrado,
        });
      }
    }
    if (nuevas.length) setLineas(nuevas);
    if (pedido.nombre || pedido.celular) setCliente({ nombre: pedido.nombre ?? '', celular: pedido.celular ?? '', cuitDni: '' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pedido, all]);

  useEffect(() => {
    let active = true;
    settingsService.get().then((s) => {
      if (!active) return;
      const habilitados = s.mediosPago && s.mediosPago.length > 0 ? s.mediosPago : DEFAULT_MEDIOS_PAGO;
      setMediosPago(habilitados);
      setRecargoTarjeta(Number(s.recargoTarjeta ?? 0));
      setMedioArs((prev) => (habilitados.includes(prev) ? prev : habilitados[0] ?? 'efectivo'));
    });
    return () => {
      active = false;
    };
  }, []);

  const candidatos = useMemo(() => {
    const term = busqueda.trim().toLowerCase();
    if (!term) return [];
    return all.filter((p) => !lineas.some((l) => l.productId === p.id) && p.nombre.toLowerCase().includes(term)).slice(0, 6);
  }, [busqueda, all, lineas]);

  const updateLinea = (id: string, patch: Partial<Linea>) =>
    setLineas((prev) => prev.map((l) => (l.productId === id ? { ...l, ...patch } : l)));
  const quitar = (id: string) => setLineas((prev) => prev.filter((l) => l.productId !== id));

  // Totales por moneda
  const t = useMemo(() => {
    let totalUsd = 0, totalArs = 0, costoUsd = 0, costoArs = 0;
    for (const l of lineas) {
      const ingreso = l.tipo === 'bonificacion' ? 0 : l.precioUnitario * l.cantidad;
      const costo = l.costoUnitario * l.cantidad;
      if (l.moneda === 'USD') { totalUsd += ingreso; costoUsd += costo; }
      else { totalArs += ingreso; costoArs += costo; }
    }
    return { totalUsd, totalArs, costoUsd, costoArs };
  }, [lineas]);

  const envioCosto = metodoEnvio === 'envio' ? costoEnvio : 0;
  const tc = Number(tipoCambio) || 0;
  const arsSiTodoEnPesos = t.totalArs + envioCosto + t.totalUsd * tc;
  const recargoTarjetaMonto =
    medioArs === 'tarjeta' ? ((t.totalArs + envioCosto) * recargoTarjeta) / 100 : 0;
  const totalArsSugerido = t.totalArs + envioCosto + recargoTarjetaMonto;
  const mediosArsDisponibles = MEDIOS_ARS.filter((medio) => mediosPago.includes(medio.value));

  const confirmar = async () => {
    setGuardando(true);
    const res = await saleService.crearVenta({
      items: lineas.map((l) => ({
        productId: l.productId,
        nombre: l.nombre,
        negocio: l.negocio,
        moneda: l.moneda,
        tipo: l.tipo,
        cantidad: l.cantidad,
        precioUnitario: l.tipo === 'bonificacion' ? 0 : l.precioUnitario,
        costoUnitario: l.costoUnitario,
      })),
      envio: { metodo: metodoEnvio, costo: envioCosto },
      pago: {
        usd: pagoUsd.trim() === '' ? t.totalUsd : Number(pagoUsd) || 0,
        ars: pagoArs.trim() === '' ? totalArsSugerido : Number(pagoArs) || 0,
        medioArs,
        tipoCambio: tc,
      },
      canal: pedido ? 'whatsapp' : 'presencial',
      cliente: cliente.nombre || cliente.celular ? cliente : undefined,
      pedidoId: pedido?.id,
    });
    setGuardando(false);
    if (res.ok) {
      toast.success(`Venta #${res.data.numero} registrada.`);
      navigate(`/adm/ventas/${res.data.id}`);
    } else toast.error(res.error.message);
  };

  return (
    <div className="mx-auto max-w-3xl">
      <Link to="/adm/ventas" className="mb-4 inline-flex items-center gap-1.5 text-sm text-text-soft hover:text-text">
        <ArrowLeft size={16} aria-hidden="true" /> Volver a ventas
      </Link>
      <h1 className="mb-5 text-2xl font-bold tracking-tight">Nueva venta</h1>

      <div className="flex flex-col gap-5">
        {/* Productos */}
        <Card>
          <CardBody className="flex flex-col gap-3">
            <div className="relative">
              <Search size={17} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-soft" aria-hidden="true" />
              <Input placeholder="Buscar producto para agregar…" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} className="pl-9" />
              {candidatos.length > 0 && (
                <div className="absolute z-10 mt-1 w-full overflow-hidden rounded-md border border-line bg-surface shadow-ti">
                  {candidatos.map((p) => (
                    <button key={p.id} type="button" onClick={() => agregar(p)} className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm hover:bg-surface-2">
                      <span className="truncate">{p.nombre}</span>
                      <span className="shrink-0 text-text-soft">{p.monedaVenta === 'USD' ? 'USD' : 'ARS'} · stock {p.stock}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {lineas.length === 0 ? (
              <p className="py-4 text-center text-sm text-text-soft">Agregá productos a la venta.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {lineas.map((l) => {
                  const bonif = l.tipo === 'bonificacion';
                  return (
                    <div key={l.productId} className="flex flex-wrap items-center gap-2 rounded-md border border-line p-2.5">
                      <span className="min-w-0 flex-1 truncate text-sm font-medium">
                        {l.nombre} <span className="text-text-faint">({l.moneda})</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => updateLinea(l.productId, { tipo: bonif ? 'venta' : 'bonificacion' })}
                        className={cn('flex items-center gap-1 rounded-pill border px-2.5 py-1 text-xs font-bold', bonif ? 'border-transparent bg-info-bg text-info' : 'border-line text-text-soft')}
                        title="Marcar como bonificación (regalo)"
                      >
                        {bonif ? <Gift size={13} /> : <ShoppingBag size={13} />}
                        {bonif ? 'Bonif.' : 'Venta'}
                      </button>
                      <input type="number" min={1} value={l.cantidad} onChange={(e) => updateLinea(l.productId, { cantidad: Math.max(1, Number(e.target.value) || 1) })} className="h-9 w-16 rounded-md border border-line bg-surface-2 px-2 text-center text-sm" aria-label="Cantidad" />
                      <input type="number" value={bonif ? 0 : l.precioUnitario} disabled={bonif} onChange={(e) => updateLinea(l.productId, { precioUnitario: Number(e.target.value) || 0 })} className="h-9 w-28 rounded-md border border-line bg-surface-2 px-2 text-right text-sm disabled:opacity-50" aria-label={`Precio (${l.moneda})`} />
                      <button type="button" onClick={() => quitar(l.productId)} aria-label="Quitar" className="text-text-soft hover:text-danger">
                        <Trash2 size={17} aria-hidden="true" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </CardBody>
        </Card>

        {/* Cobro */}
        <Card>
          <CardBody className="flex flex-col gap-4">
            <h2 className="text-base font-bold">Cobro</h2>
            <div className="rounded-md bg-surface-2 p-3 text-sm">
              <div className="flex justify-between"><span className="text-text-soft">A cobrar en dólares</span><span className="font-bold">{formatUsd(t.totalUsd)}</span></div>
              <div className="flex justify-between"><span className="text-text-soft">A cobrar en pesos {envioCosto > 0 ? '(con envío)' : ''}</span><span className="font-bold">{formatMoney(t.totalArs + envioCosto)}</span></div>
              {recargoTarjetaMonto > 0 && (
                <div className="flex justify-between"><span className="text-text-soft">Recargo tarjeta</span><span className="font-bold">{formatMoney(recargoTarjetaMonto)}</span></div>
              )}
              {t.totalUsd > 0 && tc > 0 && (
                <div className="mt-1 border-t border-line pt-1 text-text-soft">Si cobra todo en pesos: <span className="font-bold text-text">{formatMoney(arsSiTodoEnPesos)}</span> (dólar a {tc})</div>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Select label="Entrega" options={[{ value: 'retiro', label: 'Retiro en local' }, { value: 'envio', label: 'Envío' }]} value={metodoEnvio} onChange={(e) => setMetodoEnvio(e.target.value as 'retiro' | 'envio')} />
              {metodoEnvio === 'envio' && (
                <Input type="number" label="Costo de envío (ARS)" value={costoEnvio || ''} onChange={(e) => setCostoEnvio(Number(e.target.value) || 0)} />
              )}
              {t.totalUsd > 0 && (
                <Input type="number" label="Cotización del dólar (USD→ARS)" placeholder="Ej: 1200" value={tipoCambio} onChange={(e) => setTipoCambio(e.target.value)} />
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <Input type="number" label="Cobrado en USD (efectivo)" placeholder={String(t.totalUsd)} value={pagoUsd} onChange={(e) => setPagoUsd(e.target.value)} />
              <Input type="number" label="Cobrado en ARS" placeholder={String(totalArsSugerido)} value={pagoArs} onChange={(e) => setPagoArs(e.target.value)} />
              <Select label="Medio (parte ARS)" options={mediosArsDisponibles} value={medioArs} onChange={(e) => setMedioArs(e.target.value as MedioPago)} />
            </div>
            <p className="text-sm text-text-soft">Dejá los montos vacíos para usar los totales sugeridos. El dólar se cobra en efectivo. Si elegís tarjeta, se sugiere el recargo configurado.</p>
          </CardBody>
        </Card>

        {/* Cliente */}
        <Card>
          <CardBody className="flex flex-col gap-4">
            <ClienteSelector cliente={cliente} onChange={setCliente} />
            <Input label="CUIT/DNI (para facturar)" value={cliente.cuitDni || ''} onChange={(e) => setCliente({ ...cliente, cuitDni: e.target.value })} />
          </CardBody>
        </Card>

        {/* Resumen margen */}
        <Card>
          <CardBody className="flex flex-col gap-1.5 text-sm">
            {t.totalUsd > 0 && (
              <div className="flex justify-between"><span className="text-text-soft">Margen en dólares</span><span className="font-bold text-success">{formatUsd(t.totalUsd - t.costoUsd)}</span></div>
            )}
            {(t.totalArs > 0 || t.costoArs > 0) && (
              <div className="flex justify-between"><span className="text-text-soft">Margen en pesos</span><span className="font-bold text-success">{formatMoney(t.totalArs - t.costoArs)}</span></div>
            )}
          </CardBody>
        </Card>

        <div className="flex justify-end gap-2">
          <Link to="/adm/ventas"><Button variant="ghost">Cancelar</Button></Link>
          <Button onClick={confirmar} loading={guardando} disabled={lineas.length === 0}>Registrar venta</Button>
        </div>
      </div>
    </div>
  );
}
