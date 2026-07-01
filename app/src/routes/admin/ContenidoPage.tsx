import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { settingsService } from '@/services/settingsService';
import { Card, CardBody } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';

export function ContenidoPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [heroTitulo, setHeroTitulo] = useState('');
  const [heroSubtitulo, setHeroSubtitulo] = useState('');

  useEffect(() => {
    settingsService.get().then((s) => {
      setHeroTitulo(s.heroTitulo ?? 'Tecnología que sí se siente premium.');
      setHeroSubtitulo(s.heroSubtitulo ?? 'Audio, carga rápida y accesorios originales. Stock real y garantía.');
      setLoading(false);
    });
  }, []);

  const guardar = async () => {
    setSaving(true);
    const res = await settingsService.save({ heroTitulo: heroTitulo.trim(), heroSubtitulo: heroSubtitulo.trim() });
    setSaving(false);
    if (res.ok) toast.success('Contenido del home actualizado.');
    else toast.error(res.error.message);
  };

  if (loading) return <Spinner />;

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="mb-1 text-2xl font-bold tracking-tight">Contenido del home</h1>
      <p className="mb-5 text-sm text-text-soft">Texto principal que ven los clientes al entrar a la tienda.</p>
      <Card>
        <CardBody className="flex flex-col gap-4">
          <Input label="Título principal" value={heroTitulo} onChange={(e) => setHeroTitulo(e.target.value)} />
          <Textarea label="Subtítulo" value={heroSubtitulo} onChange={(e) => setHeroSubtitulo(e.target.value)} />
          <div className="flex justify-end">
            <Button onClick={guardar} loading={saving}>Guardar</Button>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
