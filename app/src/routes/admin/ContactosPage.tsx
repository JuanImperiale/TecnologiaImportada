import { useMemo, useState, useEffect } from 'react';
import { MessageCircle, Search, User, Edit2, Trash2, Check, X } from 'lucide-react';
import { toast } from 'sonner';
import { usePedidos } from '@/hooks/usePedidos';
import { useVentas } from '@/hooks/useVentas';
import { contactoAdminService } from '@/services/contactoAdminService';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { ConfirmDialog } from '@/components/ui/Modal';
import { formatDate, toDate } from '@/lib/utils';

interface Contacto {
  celular: string;
  nombre: string;
  consultas: number;
  ventas: number;
  ultimo: Date;
}

export function ContactosPage() {
  const { pedidos, loading: lp } = usePedidos();
  const { ventas, loading: lv } = useVentas();
  const [q, setQ] = useState('');
  const [editingCelular, setEditingCelular] = useState<string | null>(null);
  const [editingNombre, setEditingNombre] = useState('');
  const [saving, setSaving] = useState(false);
  const [customNames, setCustomNames] = useState<Map<string, string>>(new Map());
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [contactosEliminados, setContactosEliminados] = useState<Set<string>>(new Set());

  // Cargar ediciones y eliminaciones guardadas de Firestore al montar
  useEffect(() => {
    const cargarEdiciones = async () => {
      const res = await contactoAdminService.getAllEdiciones();
      if (res.ok) {
        const nombres = new Map<string, string>();
        const eliminados = new Set<string>();
        
        res.data.forEach((edicion, celular) => {
          if (edicion.eliminado) {
            eliminados.add(celular);
          } else if (edicion.nombre) {
            nombres.set(celular, edicion.nombre);
          }
        });
        
        setCustomNames(nombres);
        setContactosEliminados(eliminados);
      }
    };
    
    cargarEdiciones();
  }, []);

  const contactos = useMemo(() => {
    const map = new Map<string, Contacto>();
    const add = (nombre: string, celular: string, fecha: Date, tipo: 'consulta' | 'venta') => {
      const key = celular.replace(/\D/g, '');
      if (!key) return;
      const c = map.get(key) ?? { celular, nombre, consultas: 0, ventas: 0, ultimo: fecha };
      if (tipo === 'consulta') c.consultas += 1;
      else c.ventas += 1;
      if (fecha > c.ultimo) c.ultimo = fecha;
      if (nombre && !c.nombre) c.nombre = nombre;
      map.set(key, c);
    };
    pedidos.forEach((p) => add(p.nombre, p.celular, toDate(p.creado), 'consulta'));
    ventas.forEach((v) => v.cliente?.celular && add(v.cliente.nombre ?? '', v.cliente.celular, toDate(v.creado), 'venta'));
    return [...map.values()].sort((a, b) => b.ultimo.getTime() - a.ultimo.getTime());
  }, [pedidos, ventas]);

  const contactosConEdiciones = useMemo(
    () =>
      contactos
        .filter((c) => !contactosEliminados.has(c.celular.replace(/\D/g, '')))
        .map((c) => ({
          ...c,
          nombreMostrado: customNames.get(c.celular.replace(/\D/g, '')) ?? c.nombre,
        })),
    [contactos, customNames, contactosEliminados],
  );

  const lista = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return contactosConEdiciones;
    return contactosConEdiciones.filter(
      (c) => c.nombreMostrado.toLowerCase().includes(term) || c.celular.includes(term),
    );
  }, [contactosConEdiciones, q]);

  const onEditStart = (c: (typeof contactosConEdiciones)[0]) => {
    setEditingCelular(c.celular);
    setEditingNombre(c.nombreMostrado);
  };

  const onEditSave = async () => {
    if (!editingCelular || !editingNombre.trim()) return;
    setSaving(true);
    const res = await contactoAdminService.saveEdicion(editingCelular, editingNombre);
    setSaving(false);
    if (res.ok) {
      const key = editingCelular.replace(/\D/g, '');
      setCustomNames((prev) => new Map(prev).set(key, editingNombre.trim()));
      setEditingCelular(null);
      toast.success('Contacto actualizado');
    } else {
      toast.error(res.error.message);
    }
  };

  const onDeleteClick = (celular: string) => {
    setDeleteConfirm(celular);
  };

  const onDeleteConfirm = async () => {
    if (!deleteConfirm) return;
    setDeleting(true);
    const res = await contactoAdminService.deleteContacto(deleteConfirm);
    setDeleting(false);
    if (res.ok) {
      const key = deleteConfirm.replace(/\D/g, '');
      setContactosEliminados((prev) => new Set(prev).add(key));
      setDeleteConfirm(null);
      toast.success('Contacto eliminado');
    } else {
      toast.error(res.error.message);
    }
  };

  if (lp || lv) return <Spinner />;

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-4 text-2xl font-bold tracking-tight">Contactos</h1>
      <div className="relative mb-4 max-w-md">
        <Search size={17} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-soft" aria-hidden="true" />
        <Input placeholder="Buscar por nombre o celular…" value={q} onChange={(e) => setQ(e.target.value)} className="pl-9" />
      </div>

      {lista.length === 0 ? (
        <EmptyState icon={<User size={36} />} title="Sin contactos" description="Se arman solos a partir de consultas y ventas." />
      ) : (
        <div className="flex flex-col gap-2">
          {lista.map((c) => {
            const isEditing = editingCelular === c.celular;
            return (
              <Card key={c.celular} className="flex items-center gap-3 p-3">
                <div className="min-w-0 flex-1">
                  {isEditing ? (
                    <input
                      type="text"
                      value={editingNombre}
                      onChange={(e) => setEditingNombre(e.target.value)}
                      className="mb-1 w-full rounded border border-line bg-surface-2 px-2 py-1 text-sm font-medium"
                      placeholder="Nombre"
                      autoFocus
                    />
                  ) : (
                    <p className="truncate font-medium">{c.nombreMostrado || 'Sin nombre'}</p>
                  )}
                  <p className="text-sm text-text-soft">
                    {c.celular} · {c.consultas} consulta(s) · {c.ventas} venta(s) · últ. {formatDate(c.ultimo)}
                  </p>
                </div>
                {isEditing ? (
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={onEditSave}
                      disabled={saving}
                      aria-label="Guardar"
                      className="flex h-9 w-9 items-center justify-center rounded-md border border-line bg-surface-2 text-success hover:border-line-strong disabled:opacity-50"
                    >
                      <Check size={16} aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingCelular(null)}
                      aria-label="Cancelar"
                      className="flex h-9 w-9 items-center justify-center rounded-md border border-line bg-surface-2 text-danger hover:border-line-strong"
                    >
                      <X size={16} aria-hidden="true" />
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => onEditStart(c)}
                      aria-label="Editar nombre"
                      className="flex h-9 w-9 items-center justify-center rounded-md border border-line bg-surface-2 text-text hover:border-line-strong"
                    >
                      <Edit2 size={16} aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteClick(c.celular)}
                      aria-label="Eliminar"
                      className="flex h-9 w-9 items-center justify-center rounded-md border border-line bg-surface-2 text-danger hover:border-line-strong"
                    >
                      <Trash2 size={16} aria-hidden="true" />
                    </button>
                  </div>
                )}
                <a
                  href={`https://wa.me/${c.celular.replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="WhatsApp"
                  className="flex h-9 w-9 items-center justify-center rounded-md border border-line bg-surface-2 text-text hover:border-line-strong"
                >
                  <MessageCircle size={16} aria-hidden="true" />
                </a>
              </Card>
            );
          })}
        </div>
      )}

      <ConfirmDialog
        open={deleteConfirm !== null}
        title="Eliminar contacto"
        message="¿Estás seguro de que querés eliminar este contacto?"
        confirmLabel="Eliminar"
        danger
        loading={deleting}
        onConfirm={onDeleteConfirm}
        onCancel={() => setDeleteConfirm(null)}
      />
    </div>
  );
}
