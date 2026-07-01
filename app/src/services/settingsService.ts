import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { run, type Result } from './result';
import type { MedioPago, Settings } from '@/models';

const ref = () => doc(db, 'settings', 'general');

export const DEFAULT_MEDIOS_PAGO: MedioPago[] = [
  'efectivo',
  'transferencia',
  'tarjeta',
  'qr',
];

export const DEFAULT_SETTINGS: Partial<Settings> = {
  nombreNegocio: 'Tecnologia Importada',
  stockMinimoDefault: 0,
  recargoTarjeta: 0,
  mediosPago: DEFAULT_MEDIOS_PAGO,
  heroTitulo: 'Tecnologia que si se siente premium.',
  heroSubtitulo: 'Audio, carga rapida y accesorios originales. Stock real y garantia.',
  nosotrosTitulo: 'Tecnologia importada, atencion humana y criterio comercial claro.',
  nosotrosTexto:
    'TI combina catalogo online con operacion real de local. Mostramos stock confiable, respondemos rapido y acompanamos cada venta con informacion clara.',
  direccion: '',
  telefono: '',
  instagram: '',
  mapLat: undefined,
  mapLon: undefined,
  contactoTitulo: 'Te respondemos por WhatsApp con stock y opciones reales.',
  contactoTexto:
    'Podes escribirnos para consultar disponibilidad, compatibilidad, medios de pago o coordinar un pedido armado desde el carrito.',
};

function asNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim().length > 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}

/**
 * Configuración del negocio (doc `settings/general`).
 * El WhatsApp se usa en el checkout para armar el link wa.me.
 */
export const settingsService = {
  /** Lee la configuración. Devuelve {} si todavía no se guardó nada. */
  async get(): Promise<Partial<Settings>> {
    try {
      const snap = await getDoc(ref());
      const data = snap.exists() ? (snap.data() as Partial<Settings>) : {};
      return {
        ...DEFAULT_SETTINGS,
        ...data,
        mapLat: asNumber(data.mapLat),
        mapLon: asNumber(data.mapLon),
        mediosPago:
          data.mediosPago && data.mediosPago.length > 0
            ? data.mediosPago
            : DEFAULT_MEDIOS_PAGO,
      };
    } catch (error) {
      console.error('[settingsService]', error);
      return DEFAULT_SETTINGS;
    }
  },

  /** Guarda (merge) la configuración. */
  save(data: Partial<Settings>): Promise<Result<void>> {
    return run(async () => {
      await setDoc(ref(), data, { merge: true });
    });
  },

  /** Número de WhatsApp (solo dígitos, con código de país). Cae a env de respaldo. */
  async getWhatsapp(): Promise<string> {
    const data = await this.get();
    const num = (data.whatsapp as string) || import.meta.env.VITE_WHATSAPP || '';
    return num.replace(/\D/g, '');
  },
};
