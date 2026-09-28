import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { QrLabelSheet, type QrLabelItem } from '@/components/admin/QrLabelSheet';

/** Imprime etiquetas QR: `print(items)` monta las hojas y abre el diálogo del navegador. */
export function useQrPrint() {
  const [items, setItems] = useState<QrLabelItem[] | null>(null);

  useEffect(() => {
    if (!items) return;
    document.body.classList.add('qr-printing');
    const done = () => setItems(null);
    window.addEventListener('afterprint', done);
    // Deja que el portal se pinte antes de abrir el diálogo.
    const timer = window.setTimeout(() => window.print(), 50);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('afterprint', done);
      document.body.classList.remove('qr-printing');
    };
  }, [items]);

  const sheet = items ? createPortal(<QrLabelSheet items={items} />, document.body) : null;
  return { print: (list: QrLabelItem[]) => list.length > 0 && setItems(list), sheet };
}
