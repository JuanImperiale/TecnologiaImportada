import { useState } from 'react';
import { toast } from 'sonner';
import { Pencil, Trash2, Plus, Check, X } from 'lucide-react';
import { useCategories } from '@/hooks/useCategories';
import { categoryService } from '@/services/categoryService';
import { UnitTabs } from '@/components/admin/UnitTabs';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { ConfirmDialog } from '@/components/ui/Modal';
import type { Negocio, Categoria } from '@/models';

export function CategoriasPage() {
  const [negocio, setNegocio] = useState<Negocio>('productos');
  const { categories, loading, error } = useCategories(negocio);

  const [nueva, setNueva] = useState('');
  const [saving, setSaving] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [toDelete, setToDelete] = useState<Categoria | null>(null);
  const [deleting, setDeleting] = useState(false);

  const agregar = async () => {
    if (nueva.trim().length < 2) {
      toast.error('El nombre es muy corto.');
      return;
    }
    setSaving(true);
    const res = await categoryService.create(negocio, nueva, categories.length);
    setSaving(false);
    if (res.ok) {
      toast.success('Categoría creada.');
      setNueva('');
    } else toast.error(res.error.message);
  };

  const guardarEdicion = async (id: string) => {
    if (editValue.trim().length < 2) return;
    const cat = categories.find((c) => c.id === id);
    const res = await categoryService.update(id, { nombre: editValue }, cat?.nombre);
    if (res.ok) {
      toast.success('Categoría actualizada.');
      setEditId(null);
    } else toast.error(res.error.message);
  };

  const eliminar = async () => {
    if (!toDelete) return;
    setDeleting(true);
    const res = await categoryService.remove(toDelete.id);
    setDeleting(false);
    setToDelete(null);
    if (res.ok) toast.success('Categoría eliminada.');
    else toast.error(res.error.message);
  };

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight">Categorías</h1>
        <UnitTabs value={negocio} onChange={setNegocio} />
      </div>

      <Card className="mb-5 p-4">
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <Input
              label="Nueva categoría"
              placeholder="Ej: Audio, Cargadores…"
              value={nueva}
              onChange={(e) => setNueva(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && agregar()}
            />
          </div>
          <Button onClick={agregar} loading={saving}>
            <Plus size={16} aria-hidden="true" /> Agregar
          </Button>
        </div>
      </Card>

      {loading ? (
        <Spinner />
      ) : error ? (
        <EmptyState title="Error" description={error} />
      ) : categories.length === 0 ? (
        <EmptyState title="Sin categorías" description="Agregá la primera categoría arriba." />
      ) : (
        <div className="flex flex-col gap-2">
          {categories.map((cat) => (
            <Card key={cat.id} className="flex items-center gap-3 px-4 py-3">
              {editId === cat.id ? (
                <>
                  <input
                    autoFocus
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && guardarEdicion(cat.id)}
                    className="h-9 flex-1 rounded-md border border-line bg-surface-2 px-3 text-[15px] text-text"
                  />
                  <button
                    onClick={() => guardarEdicion(cat.id)}
                    aria-label="Guardar"
                    className="text-success hover:opacity-80"
                  >
                    <Check size={18} />
                  </button>
                  <button
                    onClick={() => setEditId(null)}
                    aria-label="Cancelar"
                    className="text-text-soft hover:text-text"
                  >
                    <X size={18} />
                  </button>
                </>
              ) : (
                <>
                  <span className="flex-1 font-medium">{cat.nombre}</span>
                  <button
                    onClick={() => {
                      setEditId(cat.id);
                      setEditValue(cat.nombre);
                    }}
                    aria-label="Editar"
                    className="text-text-soft hover:text-text"
                  >
                    <Pencil size={17} />
                  </button>
                  <button
                    onClick={() => setToDelete(cat)}
                    aria-label="Eliminar"
                    className="text-text-soft hover:text-danger"
                  >
                    <Trash2 size={17} />
                  </button>
                </>
              )}
            </Card>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={!!toDelete}
        title="Eliminar categoría"
        message={`¿Seguro que querés eliminar "${toDelete?.nombre}"? Los productos no se borran, pero quedan sin esta categoría.`}
        confirmLabel="Eliminar"
        danger
        loading={deleting}
        onConfirm={eliminar}
        onCancel={() => setToDelete(null)}
      />
    </div>
  );
}
