import { useEffect, useState } from 'react';
import { LocateFixed } from 'lucide-react';
import { toast } from 'sonner';
import { settingsService } from '@/services/settingsService';
import { uploadService } from '@/services/uploadService';
import { LeafletMap } from '@/components/ui/LeafletMap';
import { Card, CardBody } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { Switch } from '@/components/ui/Switch';
import { Textarea } from '@/components/ui/Textarea';
import type { MedioPago } from '@/models';

type ConfigTab = 'negocio' | 'contenido' | 'ubicacion';

function extractCoordsFromGoogleUrl(url: string): { lat: number; lon: number } | undefined {
  const trimmed = url.trim();
  if (!trimmed) return undefined;

  const patterns = [
    /@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/,
    /[?&](?:q|query)=(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/,
    /!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/,
  ];

  for (const pattern of patterns) {
    const match = trimmed.match(pattern);
    if (!match) continue;
    const lat = Number(match[1]);
    const lon = Number(match[2]);
    if (Number.isFinite(lat) && Number.isFinite(lon)) {
      return { lat, lon };
    }
  }

  return undefined;
}

const MEDIOS_PAGO: { value: MedioPago; label: string }[] = [
  { value: 'efectivo', label: 'Efectivo' },
  { value: 'transferencia', label: 'Transferencia' },
  { value: 'tarjeta', label: 'Tarjeta' },
  { value: 'qr', label: 'QR / Mercado Pago' },
];

export function ConfiguracionPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [geoLoading, setGeoLoading] = useState(false);
  const [tab, setTab] = useState<ConfigTab>('negocio');
  const [subiendoImagen, setSubiendoImagen] = useState(false);
  const [nombreNegocio, setNombreNegocio] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [stockMinimoDefault, setStockMinimoDefault] = useState('');
  const [cuit, setCuit] = useState('');
  const [recargoTarjeta, setRecargoTarjeta] = useState('');
  const [mediosPago, setMediosPago] = useState<MedioPago[]>([]);
  const [nosotrosTitulo, setNosotrosTitulo] = useState('');
  const [nosotrosTexto, setNosotrosTexto] = useState('');
  const [nosotrosImagen, setNosotrosImagen] = useState('');
  const [direccion, setDireccion] = useState('');
  const [telefono, setTelefono] = useState('');
  const [instagram, setInstagram] = useState('');
  const [mapLat, setMapLat] = useState<number | undefined>();
  const [mapLon, setMapLon] = useState<number | undefined>();
  const [contactoTitulo, setContactoTitulo] = useState('');
  const [contactoTexto, setContactoTexto] = useState('');
  const [googleMapsUrl, setGoogleMapsUrl] = useState('');

  useEffect(() => {
    settingsService.get().then((s) => {
      setNombreNegocio(s.nombreNegocio ?? 'Tecnologia Importada');
      setWhatsapp(s.whatsapp ?? '');
      setStockMinimoDefault(String(s.stockMinimoDefault ?? ''));
      setCuit(s.cuit ?? '');
      setRecargoTarjeta(String(s.recargoTarjeta ?? 0));
      setMediosPago(s.mediosPago ?? []);
      setNosotrosTitulo(s.nosotrosTitulo ?? '');
      setNosotrosTexto(s.nosotrosTexto ?? '');
      setNosotrosImagen(s.nosotrosImagen ?? '');
      setDireccion(s.direccion ?? '');
      setTelefono(s.telefono ?? '');
      setInstagram(s.instagram ?? '');
      setMapLat(s.mapLat);
      setMapLon(s.mapLon);
      setContactoTitulo(s.contactoTitulo ?? '');
      setContactoTexto(s.contactoTexto ?? '');
      setGoogleMapsUrl(s.mapaEmbedUrl ?? '');
      setLoading(false);
    });
  }, []);

  const toggleMedio = (medio: MedioPago) => {
    setMediosPago((prev) =>
      prev.includes(medio) ? prev.filter((item) => item !== medio) : [...prev, medio],
    );
  };

  const subirImagen = async (file: File | null) => {
    if (!file) return;
    setSubiendoImagen(true);
    const res = await uploadService.uploadProductImage(file, 'productos');
    setSubiendoImagen(false);
    if (res.ok) {
      setNosotrosImagen(res.data);
      toast.success('Imagen subida. Guardá la configuración para publicarla.');
    } else {
      toast.error(res.error.message);
    }
  };

  const guardar = async () => {
    if (mediosPago.length === 0) {
      toast.error('Activá al menos un medio de pago.');
      return;
    }

    setSaving(true);
    const res = await settingsService.save({
      nombreNegocio: nombreNegocio.trim(),
      whatsapp: whatsapp.replace(/\D/g, ''),
      stockMinimoDefault: Number(stockMinimoDefault) || 0,
      cuit: cuit.trim(),
      recargoTarjeta: Number(recargoTarjeta) || 0,
      mediosPago,
      nosotrosTitulo: nosotrosTitulo.trim(),
      nosotrosTexto: nosotrosTexto.trim(),
      nosotrosImagen: nosotrosImagen.trim(),
      direccion: direccion.trim(),
      telefono: telefono.trim(),
      instagram: instagram.trim(),
      mapLat,
      mapLon,
      mapaEmbedUrl: googleMapsUrl.trim(),
      contactoTitulo: contactoTitulo.trim(),
      contactoTexto: contactoTexto.trim(),
    });
    setSaving(false);

    if (res.ok) toast.success('Configuración guardada.');
    else toast.error(res.error.message);
  };

  const usarMiUbicacion = () => {
    if (!navigator.geolocation) {
      toast.error('Tu navegador no soporta geolocalización.');
      return;
    }

    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setMapLat(position.coords.latitude);
        setMapLon(position.coords.longitude);
        setGeoLoading(false);
        toast.success('Ubicación tomada desde el navegador. Guardá para aplicar.');
      },
      () => {
        setGeoLoading(false);
        toast.error('No se pudo obtener tu ubicación. Revisá los permisos del navegador.');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    );
  };

  const tomarCoordenadasDesdeGoogle = () => {
    const coords = extractCoordsFromGoogleUrl(googleMapsUrl);
    if (!coords) {
      toast.error('No pude detectar coordenadas en ese link de Google Maps.');
      return;
    }
    setMapLat(coords.lat);
    setMapLon(coords.lon);
    toast.success('Coordenadas tomadas desde Google Maps. Guardá para aplicar.');
  };

  const googlePreviewSrc =
    mapLat != null && mapLon != null
      ? `https://www.google.com/maps?q=${mapLat},${mapLon}&z=16&output=embed`
      : googleMapsUrl.trim()
        ? `https://www.google.com/maps?q=${encodeURIComponent(googleMapsUrl.trim())}&z=16&output=embed`
        : '';

  if (loading) return <Spinner />;

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="mb-5 text-2xl font-bold tracking-tight">Configuración</h1>

      <div className="mb-4 inline-flex w-full overflow-hidden rounded-pill border border-line bg-surface-2 p-1">
        <button
          type="button"
          onClick={() => setTab('negocio')}
          className={[
            'flex flex-1 items-center justify-center rounded-pill px-3 py-2 text-sm font-bold transition-colors',
            tab === 'negocio' ? 'bg-accent text-on-accent' : 'text-text-soft hover:text-text',
          ].join(' ')}
        >
          Negocio
        </button>
        <button
          type="button"
          onClick={() => setTab('contenido')}
          className={[
            'flex flex-1 items-center justify-center rounded-pill px-3 py-2 text-sm font-bold transition-colors',
            tab === 'contenido' ? 'bg-accent text-on-accent' : 'text-text-soft hover:text-text',
          ].join(' ')}
        >
          Contenido público
        </button>
        <button
          type="button"
          onClick={() => setTab('ubicacion')}
          className={[
            'flex flex-1 items-center justify-center rounded-pill px-3 py-2 text-sm font-bold transition-colors',
            tab === 'ubicacion' ? 'bg-accent text-on-accent' : 'text-text-soft hover:text-text',
          ].join(' ')}
        >
          Ubicación
        </button>
      </div>

      <div className="grid gap-5">
        {tab === 'negocio' && (
          <Card>
            <CardBody className="flex flex-col gap-4">
              <h2 className="text-base font-bold">Negocio y operación</h2>
              <Input
                label="Nombre del negocio"
                value={nombreNegocio}
                onChange={(e) => setNombreNegocio(e.target.value)}
              />
              <div>
                <Input
                  label="WhatsApp del negocio"
                  type="tel"
                  placeholder="Ej: 5491122334455"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                />
                <p className="mt-1 text-sm text-text-soft">
                  Solo dígitos con código de país. A este número llegan los pedidos y el CTA público.
                </p>
              </div>
              <Input label="Teléfono visible" value={telefono} onChange={(e) => setTelefono(e.target.value)} />
              <Input label="Dirección" value={direccion} onChange={(e) => setDireccion(e.target.value)} />
              <Input
                label="Instagram"
                placeholder="https://instagram.com/tu_cuenta"
                value={instagram}
                onChange={(e) => setInstagram(e.target.value)}
              />
              <Input
                label="Stock mínimo por defecto"
                type="number"
                value={stockMinimoDefault}
                onChange={(e) => setStockMinimoDefault(e.target.value)}
              />
              <Input label="CUIT" value={cuit} onChange={(e) => setCuit(e.target.value)} />
              <Input
                label="Recargo por tarjeta (%)"
                type="number"
                value={recargoTarjeta}
                onChange={(e) => setRecargoTarjeta(e.target.value)}
              />
              <div className="flex flex-col gap-3 rounded-lg border border-line bg-surface-2 p-4">
                <div>
                  <p className="text-sm font-semibold text-text">Medios de pago habilitados</p>
                  <p className="text-sm text-text-soft">
                    Se usan en la venta y en la configuración del negocio.
                  </p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {MEDIOS_PAGO.map((medio) => (
                    <Switch
                      key={medio.value}
                      checked={mediosPago.includes(medio.value)}
                      onChange={() => toggleMedio(medio.value)}
                      label={medio.label}
                    />
                  ))}
                </div>
              </div>
            </CardBody>
          </Card>
        )}

        {tab === 'contenido' && (
          <Card>
            <CardBody className="flex flex-col gap-4">
              <h2 className="text-base font-bold">Nosotros y contacto público</h2>
              <Input
                label="Título de Nosotros"
                value={nosotrosTitulo}
                onChange={(e) => setNosotrosTitulo(e.target.value)}
              />
              <Textarea
                label="Texto principal"
                value={nosotrosTexto}
                onChange={(e) => setNosotrosTexto(e.target.value)}
              />
              <Input
                label="Título de contacto"
                value={contactoTitulo}
                onChange={(e) => setContactoTitulo(e.target.value)}
              />
              <Textarea
                label="Texto de contacto"
                value={contactoTexto}
                onChange={(e) => setContactoTexto(e.target.value)}
              />
              <div className="flex flex-col gap-3 rounded-lg border border-line bg-surface-2 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-text">Imagen institucional</p>
                    <p className="text-sm text-text-soft">Se muestra en la vista pública de Nosotros.</p>
                  </div>
                  {nosotrosImagen ? (
                    <img
                      src={nosotrosImagen}
                      alt="Vista previa"
                      className="h-16 w-16 rounded-md border border-line object-cover"
                    />
                  ) : null}
                </div>
                <Input
                  label="URL de imagen"
                  value={nosotrosImagen}
                  onChange={(e) => setNosotrosImagen(e.target.value)}
                />
                <label className="flex flex-col gap-2 text-sm font-medium text-text-soft">
                  <span>Subir imagen institucional</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => void subirImagen(e.target.files?.[0] ?? null)}
                    className="text-sm text-text-soft file:mr-3 file:rounded-pill file:border-0 file:bg-accent file:px-4 file:py-2 file:text-sm file:font-bold file:text-on-accent"
                  />
                </label>
                {subiendoImagen && <p className="text-sm text-text-soft">Subiendo imagen…</p>}
              </div>
            </CardBody>
          </Card>
        )}

        {tab === 'ubicacion' && (
          <Card>
            <CardBody className="flex flex-col gap-4">
              <h2 className="text-base font-bold">Ubicación del local en el mapa</h2>
              <p className="text-sm text-text-soft">
                Podés usar tu ubicación actual o hacer clic en el mapa para ubicar el pin exacto.
              </p>
              <Input
                label="Link de Google Maps (opcional)"
                placeholder="Pegá el link de compartir ubicación"
                value={googleMapsUrl}
                onChange={(e) => setGoogleMapsUrl(e.target.value)}
              />
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="ghost" onClick={usarMiUbicacion} loading={geoLoading}>
                  <LocateFixed size={16} aria-hidden="true" /> Usar mi ubicación actual
                </Button>
                <Button type="button" variant="ghost" onClick={tomarCoordenadasDesdeGoogle}>
                  Tomar coordenadas desde Google
                </Button>
                {(mapLat != null || mapLon != null) && (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      setMapLat(undefined);
                      setMapLon(undefined);
                    }}
                  >
                    Limpiar ubicación
                  </Button>
                )}
              </div>
              <LeafletMap
                lat={mapLat}
                lon={mapLon}
                label="TI"
                interactive
                onPick={({ lat, lon }) => {
                  setMapLat(lat);
                  setMapLon(lon);
                }}
                className="h-80 w-full overflow-hidden rounded-lg"
              />
              {mapLat != null && mapLon != null && (
                <p className="text-xs text-text-faint">
                  Lat {mapLat.toFixed(6)}, Lon {mapLon.toFixed(6)}
                </p>
              )}
              {googlePreviewSrc && (
                <div className="overflow-hidden rounded-lg border border-line">
                  <iframe
                    title="Vista previa Google Maps"
                    src={googlePreviewSrc}
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    className="h-72 w-full border-0"
                  />
                </div>
              )}
            </CardBody>
          </Card>
        )}

        <div className="flex justify-end">
          <Button onClick={guardar} loading={saving || subiendoImagen || geoLoading}>
            Guardar configuración
          </Button>
        </div>
      </div>
    </div>
  );
}
