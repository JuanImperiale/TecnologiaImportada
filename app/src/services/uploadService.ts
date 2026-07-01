import { ok, fail, type Result } from './result';
import type { Negocio } from '@/models';

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

/** Comprime una imagen en el cliente (reduce tamaño antes de subir). */
async function compressImage(file: File, maxSize = 1280, quality = 0.82): Promise<Blob> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const i = new Image();
    i.onload = () => resolve(i);
    i.onerror = reject;
    i.src = dataUrl;
  });

  const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
  const w = Math.round(img.width * scale);
  const h = Math.round(img.height * scale);
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('No se pudo procesar la imagen');
  ctx.drawImage(img, 0, 0, w, h);

  return await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('No se pudo comprimir la imagen'))),
      'image/jpeg',
      quality,
    );
  });
}

export const uploadService = {
  /**
   * Sube una imagen de producto a Cloudinary (upload unsigned) y devuelve su URL.
   * Requiere VITE_CLOUDINARY_CLOUD_NAME y VITE_CLOUDINARY_UPLOAD_PRESET en .env.local.
   */
  async uploadProductImage(file: File, negocio: Negocio): Promise<Result<string>> {
    if (!CLOUD_NAME || !UPLOAD_PRESET) {
      return fail(
        'config',
        'Falta configurar Cloudinary. Completá VITE_CLOUDINARY_* en .env.local (ver README).',
      );
    }
    try {
      const blob = await compressImage(file);
      const form = new FormData();
      form.append('file', blob);
      form.append('upload_preset', UPLOAD_PRESET);
      form.append('folder', `tecnologia-importada/${negocio}`);

      const resp = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
        method: 'POST',
        body: form,
      });

      if (!resp.ok) {
        const detail = await resp.text();
        console.error('[uploadService] Cloudinary', resp.status, detail);
        return fail('upload', 'No se pudo subir la imagen. Revisá la configuración de Cloudinary.');
      }

      const data = (await resp.json()) as { secure_url?: string };
      if (!data.secure_url) return fail('upload', 'Cloudinary no devolvió la URL de la imagen.');
      return ok(data.secure_url);
    } catch (error) {
      console.error('[uploadService]', error);
      return fail('upload', 'No se pudo subir la imagen. Intentá de nuevo.');
    }
  },
};
