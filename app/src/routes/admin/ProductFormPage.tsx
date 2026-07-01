import { useEffect, useState, useRef } from 'react';
import { useNavigate, useParams, useSearchParams, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { ArrowLeft, Upload, X, ImageOff } from 'lucide-react';
import { productoFormSchema, type ProductoForm } from '@/schemas';
import { productService } from '@/services/productService';
import { uploadService } from '@/services/uploadService';
import { useCategories } from '@/hooks/useCategories';
import { Card, CardBody } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { Switch } from '@/components/ui/Switch';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { formatPrice } from '@/lib/utils';
import type { Negocio } from '@/models';

export function ProductFormPage() {
  const { id } = useParams();
  const isEdit = !!id;
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const initialNegocio = (params.get('negocio') as Negocio) || 'productos';

  const [imagenes, setImagenes] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [loadingDoc, setLoadingDoc] = useState(isEdit);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProductoForm>({
    resolver: zodResolver(productoFormSchema),
    defaultValues: {
      nombre: '',
      negocio: initialNegocio,
      categoriaId: '',
      descripcion: '',
      monedaVenta: 'USD',
      costo: 0,
      gananciaModo: 'porcentaje',
      precioVenta: 0,
      sku: '',
      stock: 0,
      stockMinimo: 0,
      activo: true,
      destacado: false,
      variantes: [],
    },
  });

  const negocio = watch('negocio');
  const moneda = watch('monedaVenta');
  const gananciaModo = watch('gananciaModo');
  const gananciaValor = watch('gananciaValor');
  const costo = watch('costo');
  const activo = watch('activo');
  const destacado = watch('destacado');
  const { categories } = useCategories(negocio);
  // Auto-resolve legacy products that have categoria name but no categoriaId
  const pendingCategoryName = useRef<string | null>(null);
  useEffect(() => {
    if (!pendingCategoryName.current || !categories.length) return;
    const cat = categories.find((c) => c.nombre === pendingCategoryName.current);
    if (cat) setValue('categoriaId', cat.id);
    pendingCategoryName.current = null;
  }, [categories, setValue]);

  const g = Number(gananciaValor) || 0;
  const base = Number(costo) || 0;
  const precioSugerido = gananciaModo === 'porcentaje' ? base * (1 + g / 100) : base + g;

  useEffect(() => {
    if (!isEdit || !id) return;
    let active = true;
    productService.get(id).then((res) => {
      if (!active) return;
      if (res.ok && res.data) {
        const p = res.data;
        if (!p.categoriaId && p.categoria) pendingCategoryName.current = p.categoria;
        reset({
          nombre: p.nombre,
          negocio: p.negocio,
          categoriaId: p.categoriaId ?? '',
          descripcion: p.descripcion ?? '',
          monedaVenta: p.monedaVenta ?? 'USD',
          costo: p.costo,
          gananciaModo: p.gananciaModo ?? 'porcentaje',
          gananciaValor: p.gananciaValor,
          precioVenta: p.precioVenta,
          precioAnterior: p.precioAnterior,
          sku: p.sku ?? '',
          stock: p.stock,
          stockMinimo: p.stockMinimo ?? 0,
          activo: p.activo,
          destacado: p.destacado ?? false,
          variantes: [],
        });
        setImagenes(p.imagenes ?? []);
      } else {
        toast.error('No se encontró el producto.');
        navigate('/adm/inventario', { replace: true });
      }
      setLoadingDoc(false);
    });
    return () => {
      active = false;
    };
  }, [id, isEdit, reset, navigate]);

  const onFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    for (const file of Array.from(files)) {
      const res = await uploadService.uploadProductImage(file, negocio);
      if (res.ok) setImagenes((prev) => [...prev, res.data]);
      else toast.error(res.error.message);
    }
    setUploading(false);
  };

  const removeImage = (url: string) => setImagenes((prev) => prev.filter((u) => u !== url));

  const onSubmit = handleSubmit(async (data) => {
    const payload = { ...data, imagenes };
    const res = isEdit ? await productService.update(id!, payload) : await productService.create(payload);
    if (res.ok) {
      toast.success(isEdit ? 'Producto actualizado.' : 'Producto creado.');
      navigate('/adm/inventario');
    } else {
      toast.error(res.error.message);
    }
  });

  if (loadingDoc) return <Spinner />;

  return (
    <div className="mx-auto max-w-2xl">
      <Link to="/adm/inventario" className="mb-4 inline-flex items-center gap-1.5 text-sm text-text-soft hover:text-text">
        <ArrowLeft size={16} aria-hidden="true" /> Volver al inventario
      </Link>
      <h1 className="mb-5 text-2xl font-bold tracking-tight">{isEdit ? 'Editar producto' : 'Nuevo producto'}</h1>

      <form onSubmit={onSubmit} className="flex flex-col gap-5" noValidate>
        <Card>
          <CardBody className="flex flex-col gap-4">
            <Input label="Nombre" error={errors.nombre?.message} {...register('nombre')} />
            <div className="grid gap-4 sm:grid-cols-2">
              <Select
                label="Unidad de negocio"
                options={[
                  { value: 'productos', label: 'Productos' },
                  { value: 'accesorios', label: 'Accesorios' },
                ]}
                {...register('negocio')}
              />
              <Select
                label="Categoría"
                placeholder={categories.length ? 'Elegí una categoría' : 'No hay categorías aún'}
                options={categories.map((c) => ({ value: c.id, label: c.nombre }))}
                error={errors.categoriaId?.message}
                {...register('categoriaId')}
              />
            </div>
            <Textarea label="Descripción" {...register('descripcion')} />
          </CardBody>
        </Card>

        {/* Moneda, costo y precio (todo en la misma moneda, sin conversión) */}
        <Card>
          <CardBody className="flex flex-col gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Select
                label="Moneda del producto"
                options={[
                  { value: 'USD', label: 'USD (dólares)' },
                  { value: 'ARS', label: 'ARS (pesos)' },
                ]}
                {...register('monedaVenta')}
              />
              <Input
                type="number"
                step="0.01"
                label={`Costo (${moneda})`}
                error={errors.costo?.message}
                {...register('costo', { valueAsNumber: true })}
              />
              <Select
                label="Calcular ganancia por"
                options={[
                  { value: 'porcentaje', label: '% sobre el costo' },
                  { value: 'monto', label: `Monto (${moneda})` },
                ]}
                {...register('gananciaModo')}
              />
              <Input
                type="number"
                step="0.01"
                label={gananciaModo === 'porcentaje' ? 'Ganancia (%)' : `Ganancia (${moneda})`}
                placeholder={gananciaModo === 'porcentaje' ? 'Ej: 40' : 'Ej: 150'}
                {...register('gananciaValor', { setValueAs: (v) => (v === '' ? undefined : Number(v)) })}
              />
            </div>

            <div className="flex flex-wrap items-center gap-3 rounded-md bg-surface-2 px-4 py-3">
              <div className="flex-1">
                <p className="text-sm text-text-soft">Precio sugerido</p>
                <p className="text-lg font-bold">{formatPrice(precioSugerido, moneda)}</p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setValue('precioVenta', Math.round(precioSugerido), { shouldValidate: true })}
              >
                Aplicar al precio final
              </Button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                type="number"
                step="0.01"
                label={`Precio de venta (${moneda})`}
                error={errors.precioVenta?.message}
                {...register('precioVenta', { valueAsNumber: true })}
              />
              <Input
                type="number"
                step="0.01"
                label={`Precio anterior (${moneda}, opcional)`}
                {...register('precioAnterior', { setValueAs: (v) => (v === '' ? undefined : Number(v)) })}
              />
            </div>
            <p className="text-sm text-text-soft">
              El producto se carga y se muestra en {moneda}. La conversión (si paga en otra moneda) se hace
              recién al registrar la venta.
            </p>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="flex flex-col gap-4">
            <h2 className="text-base font-bold">Stock</h2>
            <div className="grid gap-4 sm:grid-cols-3">
              <Input type="number" step="1" label="Stock actual" error={errors.stock?.message} {...register('stock', { valueAsNumber: true })} />
              <Input type="number" step="1" label="Stock mínimo" {...register('stockMinimo', { valueAsNumber: true })} />
              <Input label="SKU (opcional)" {...register('sku')} />
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="flex flex-col gap-4">
            <h2 className="text-base font-bold">Imágenes</h2>
            <div className="flex flex-wrap gap-3">
              {imagenes.map((url) => (
                <div key={url} className="relative h-24 w-24 overflow-hidden rounded-md border border-line">
                  <img src={url} alt="" className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeImage(url)}
                    aria-label="Quitar imagen"
                    className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/55 text-white"
                  >
                    <X size={14} aria-hidden="true" />
                  </button>
                </div>
              ))}
              <label className="flex h-24 w-24 cursor-pointer flex-col items-center justify-center gap-1 rounded-md border border-dashed border-line text-text-soft hover:border-line-strong">
                {uploading ? (
                  <Spinner size={18} className="p-0" />
                ) : (
                  <>
                    <Upload size={18} aria-hidden="true" />
                    <span className="text-xs">Subir</span>
                  </>
                )}
                <input type="file" accept="image/*" multiple className="hidden" disabled={uploading} onChange={(e) => onFiles(e.target.files)} />
              </label>
              {imagenes.length === 0 && !uploading && (
                <span className="flex items-center gap-1.5 self-center text-sm text-text-faint">
                  <ImageOff size={16} aria-hidden="true" /> Sin imágenes
                </span>
              )}
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="flex flex-col gap-4">
            <Switch checked={activo} onChange={(v) => setValue('activo', v)} label="Activo (visible en la tienda)" />
            <Switch checked={destacado} onChange={(v) => setValue('destacado', v)} label="Destacado (aparece en el home)" />
          </CardBody>
        </Card>

        <div className="flex justify-end gap-2">
          <Link to="/adm/inventario">
            <Button type="button" variant="ghost">Cancelar</Button>
          </Link>
          <Button type="submit" loading={isSubmitting} disabled={uploading}>
            {isEdit ? 'Guardar cambios' : 'Crear producto'}
          </Button>
        </div>
      </form>
    </div>
  );
}
