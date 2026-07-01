import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Trash2, Plus, Edit2, Sparkles } from 'lucide-react';
import { deleteField } from 'firebase/firestore';
import { toast } from 'sonner';
import { novedadesService } from '@/services/novedadesService';
import { uploadService } from '@/services/uploadService';
import { useNovedadesAdmin } from '@/hooks/useNovedades';
import { Card, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { Switch } from '@/components/ui/Switch';
import { Spinner } from '@/components/ui/Spinner';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { parseInstagramPostUrl } from '@/lib/instagram';
import dayjs from 'dayjs';

const novedadSchema = z
  .object({
    titulo: z.string().min(1, 'Título requerido'),
    texto: z.string().optional(),
    tipo: z.enum(['imagen', 'instagram'] as const),
    mediaUrl: z.string().optional(),
    instagramPostUrl: z.string().optional(),
    ctaLabel: z.string().optional(),
    ctaUrl: z.string().optional(),
    diasVencimiento: z.number().int().positive().optional(),
    estado: z.enum(['borrador', 'publicada'] as const),
    destacado: z.boolean(),
    orden: z.number().int().nonnegative(),
  })
  .superRefine((data, ctx) => {
    if (data.tipo === 'imagen' && !data.mediaUrl?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['mediaUrl'],
        message: 'Subí una imagen para esta novedad.',
      });
    }

    if (data.tipo === 'instagram') {
      const parsed = data.instagramPostUrl ? parseInstagramPostUrl(data.instagramPostUrl) : null;
      if (!parsed) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['instagramPostUrl'],
          message: 'Pegá una URL válida de Instagram (post o reel).',
        });
      }
    }
  });

type NovedadForm = z.infer<typeof novedadSchema>;

export function NovedadesPageAdmin() {
  const { novedades, loading } = useNovedadesAdmin();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; titulo: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<NovedadForm>({
    resolver: zodResolver(novedadSchema),
    defaultValues: {
      tipo: 'imagen',
      estado: 'publicada',
      destacado: false,
      orden: 0,
    },
  });

  const tipoWatch = watch('tipo');
  const instagramPostUrlWatch = watch('instagramPostUrl');
  const parsedInstagramPreview = instagramPostUrlWatch
    ? parseInstagramPostUrl(instagramPostUrlWatch)
    : null;

  const onSubmit = async (data: NovedadForm) => {
    try {
      // Obtener la novedad actual si estamos editando
      const currentNovedad = editingId 
        ? novedades.find(n => n.id === editingId)
        : null;

      // Construir payload base
      const basePayload: Record<string, any> = {
        titulo: data.titulo,
        tipo: data.tipo,
        estado: data.estado,
        destacado: data.destacado,
        orden: data.orden,
      };

      // Campos opcionales: incluir si tienen valor, o deleteField() si estaban antes pero ahora están vacíos
      const optionalFields = [
        { key: 'texto', value: data.texto },
        { key: 'ctaLabel', value: data.ctaLabel },
        { key: 'ctaUrl', value: data.ctaUrl },
        { key: 'diasVencimiento', value: data.diasVencimiento ? String(data.diasVencimiento) : '' },
      ];

      for (const field of optionalFields) {
        if (field.value) {
          basePayload[field.key] = field.key === 'diasVencimiento' 
            ? parseInt(field.value)
            : field.value;
        } else if (editingId && currentNovedad && (currentNovedad as any)[field.key] !== undefined) {
          // Si estamos editando y el campo tenía un valor antes, elimínalo explícitamente
          basePayload[field.key] = deleteField();
        }
      }

      let payload: Record<string, any>;
      if (data.tipo === 'imagen') {
        payload = { ...basePayload };
        if (data.mediaUrl) {
          payload.mediaUrl = data.mediaUrl;
        } else if (editingId && currentNovedad && currentNovedad.mediaUrl) {
          payload.mediaUrl = deleteField();
        }
      } else {
        const parsed = data.instagramPostUrl ? parseInstagramPostUrl(data.instagramPostUrl) : null;
        payload = { ...basePayload };
        if (parsed?.canonicalUrl) {
          payload.instagramPostUrl = parsed.canonicalUrl;
        } else if (editingId && currentNovedad && currentNovedad.instagramPostUrl) {
          payload.instagramPostUrl = deleteField();
        }
      }

      if (editingId) {
        await novedadesService.update(editingId, payload as any);
        toast.success('Novedad actualizada');
      } else {
        const result = await novedadesService.create(payload as any);
        if (result.ok) {
          toast.success('Novedad creada');
          setIsModalOpen(false);
          reset();
          setEditingId(null);
        } else {
          toast.error(result.error.message);
        }
        return;
      }
      setIsModalOpen(false);
      reset();
      setEditingId(null);
    } catch (error) {
      toast.error('Error al guardar');
      console.error(error);
    }
  };

  const handleEdit = (novedad: typeof novedades[0]) => {
    reset(novedad);
    setEditingId(novedad.id);
    setIsModalOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await novedadesService.delete(deleteTarget.id);
      toast.success('Novedad eliminada');
      setDeleteTarget(null);
    } catch (error) {
      toast.error('Error al eliminar');
      console.error(error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingImage(true);
    try {
      const result = await uploadService.uploadProductImage(file, 'productos');
      if (result.ok && result.data) {
        setValue('mediaUrl', result.data);
        toast.success('Imagen subida');
      } else {
        toast.error('Error al subir imagen');
      }
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleNewNovedad = () => {
    reset({
      tipo: 'imagen',
      estado: 'publicada',
      destacado: false,
      orden: novedades.length,
    });
    setEditingId(null);
    setIsModalOpen(true);
  };

  if (loading) return <Spinner className="min-h-[60vh]" />;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Novedades</h1>
        <Button onClick={handleNewNovedad}>
          <Plus className="w-4 h-4" />
          Nueva
        </Button>
      </div>

      {/* List */}
      {novedades.length === 0 ? (
        <Card>
          <CardBody className="text-center py-12 text-text-soft">
            No hay novedades. Crea una para empezar.
          </CardBody>
        </Card>
      ) : (
        <div className="grid gap-4">
          {novedades.map((novedad) => (
            <Card key={novedad.id}>
              <CardBody className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold">{novedad.titulo}</h3>
                    <Badge
                      tone={novedad.estado === 'publicada' ? 'success' : 'neutral'}
                    >
                      {novedad.estado}
                    </Badge>
                    {novedad.destacado && (
                      <Badge tone="info" className="inline-flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        Destacado
                      </Badge>
                    )}
                  </div>

                  {novedad.texto && (
                    <p className="text-sm text-text-soft mt-1 line-clamp-2">{novedad.texto}</p>
                  )}

                  <div className="text-xs text-text-soft mt-2 space-y-1">
                    <p>Tipo: {novedad.tipo}</p>
                    {novedad.diasVencimiento && (
                      <p>
                        Vence en {novedad.diasVencimiento} días
                        {novedad.creado && (
                          <span>
                            (
                            {dayjs(novedad.creado.toDate())
                              .add(novedad.diasVencimiento, 'day')
                              .format('DD/MM/YYYY')}
                            )
                          </span>
                        )}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleEdit(novedad)}
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => setDeleteTarget({ id: novedad.id, titulo: novedad.titulo })}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      {/* Modal */}
      <Modal 
        open={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={editingId ? 'Editar novedad' : 'Nueva novedad'}
        footer={
          <div className="flex gap-2 w-full">
            <Button
              variant="ghost"
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting} 
              className="flex-1"
              onClick={handleSubmit(onSubmit)}
            >
              {isSubmitting ? <Spinner className="h-4" /> : 'Guardar'}
            </Button>
          </div>
        }
      >
        <form className="flex flex-col gap-4">

          {/* Título */}
          <div>
            <label className="text-sm font-medium">Título *</label>
            <Input
              {...register('titulo')}
              placeholder="Ej: Flash sale"
              error={errors.titulo?.message}
            />
          </div>

          {/* Texto */}
          <div>
            <label className="text-sm font-medium">Descripción</label>
            <Textarea
              {...register('texto')}
              placeholder="Descripción o detalles"
              rows={3}
            />
          </div>

          {/* Tipo */}
          <div>
            <label className="text-sm font-medium">Tipo *</label>
            <Select
              {...register('tipo')}
              options={[
                { value: 'imagen', label: 'Imagen' },
                { value: 'instagram', label: 'Instagram' },
              ]}
              error={errors.tipo?.message}
            />
          </div>

          {/* Media: Imagen */}
          {tipoWatch === 'imagen' && (
            <div>
              <label className="text-sm font-medium">Imagen</label>
              <div className="flex gap-2">
                <input
                  type="file"
                  accept="image/*"
                  aria-label="Subir imagen de la novedad"
                  title="Subir imagen de la novedad"
                  onChange={handleImageUpload}
                  disabled={isUploadingImage}
                  className="flex-1 rounded border border-line px-3 py-2 text-sm"
                />
              </div>
              {watch('mediaUrl') && (
                <p className="text-xs text-text-soft mt-1">✓ Imagen subida</p>
              )}
              {isUploadingImage && <Spinner className="h-8" />}
            </div>
          )}

          {/* Media: Instagram */}
          {tipoWatch === 'instagram' && (
            <div>
              <label className="text-sm font-medium">Link del post de Instagram</label>
              <Input
                {...register('instagramPostUrl')}
                placeholder="https://www.instagram.com/p/ABC123DEF/"
                error={errors.instagramPostUrl?.message}
              />
              {instagramPostUrlWatch?.trim() && (
                <div className="mt-2 rounded-md border border-line bg-surface-2 px-3 py-2 text-xs">
                  {parsedInstagramPreview ? (
                    <>
                      <p className="font-semibold text-green-700">URL valida y normalizada</p>
                      <p className="mt-1 break-all text-text-soft">
                        {parsedInstagramPreview.canonicalUrl}
                      </p>
                    </>
                  ) : (
                    <p className="font-semibold text-red-700">
                      URL invalida: usa un link de Instagram tipo post o reel.
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* CTA */}
          <div className="grid gap-2 grid-cols-2">
            <div>
              <label className="text-sm font-medium">Botón CTA</label>
              <Input
                {...register('ctaLabel')}
                placeholder="Ej: Ver más"
              />
            </div>
            <div>
              <label className="text-sm font-medium">URL destino</label>
              <Input
                {...register('ctaUrl')}
                placeholder="/catalogo"
              />
            </div>
          </div>

          {/* Vencimiento */}
          <div className="grid gap-2 grid-cols-2">
            <div>
              <label className="text-sm font-medium">Días de vencimiento</label>
              <Input
                type="number"
                {...register('diasVencimiento', { valueAsNumber: true })}
                placeholder="Ej: 7"
                error={errors.diasVencimiento?.message}
              />
            </div>

            {/* Estado */}
            <div>
              <label className="text-sm font-medium">Estado *</label>
              <Select
                {...register('estado')}
                options={[
                  { value: 'borrador', label: 'Borrador' },
                  { value: 'publicada', label: 'Publicada' },
                ]}
              />
            </div>
          </div>

          {/* Destacado */}
          <div className="bg-surface-2 rounded-md p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-accent" />
              <label className="text-sm font-medium">Mostrar popup en inicio</label>
            </div>
            <Switch
              checked={watch('destacado')}
              onChange={(checked) => setValue('destacado', checked)}
            />
          </div>

          {/* Orden */}
          <div>
            <label className="text-sm font-medium">Orden</label>
            <Input
              type="number"
              {...register('orden', { valueAsNumber: true })}
              placeholder="0"
              error={errors.orden?.message}
            />
          </div>
        </form>
      </Modal>

      <Modal
        open={!!deleteTarget}
        onClose={() => {
          if (!isDeleting) setDeleteTarget(null);
        }}
        title="Eliminar novedad"
        footer={
          <div className="flex gap-2 w-full">
            <Button
              variant="ghost"
              type="button"
              onClick={() => setDeleteTarget(null)}
              className="flex-1"
              disabled={isDeleting}
            >
              Cancelar
            </Button>
            <Button
              variant="danger"
              type="button"
              onClick={handleDelete}
              className="flex-1"
              disabled={isDeleting}
            >
              {isDeleting ? <Spinner className="h-4" /> : 'Eliminar'}
            </Button>
          </div>
        }
      >
        <div className="p-1 text-sm text-text-soft">
          {deleteTarget
            ? `Se eliminará "${deleteTarget.titulo}". Esta acción no se puede deshacer.`
            : ''}
        </div>
      </Modal>
    </div>
  );
}
