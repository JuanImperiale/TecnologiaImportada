import { QRCodeSVG } from 'qrcode.react';
import { chunk, productPublicUrl } from '@/lib/utils';

export const QR_LABELS_PER_PAGE = 30;

export interface QrLabelItem {
  id: string;
  nombre: string;
}

/** Hojas A4 de etiquetas (5x6). Solo visibles al imprimir; ver estilos `.qr-print-root` en index.css. */
export function QrLabelSheet({ items }: { items: QrLabelItem[] }) {
  return (
    <div className="qr-print-root" aria-hidden="true">
      {chunk(items, QR_LABELS_PER_PAGE).map((page, i) => (
        <div key={i} className="qr-page">
          {page.map((item) => (
            <div key={item.id} className="qr-label">
              <QRCodeSVG value={productPublicUrl(item.id)} level="M" marginSize={0} className="qr-label__code" />
              <span className="qr-label__name">{item.nombre}</span>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
