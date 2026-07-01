import { Link, useLocation } from 'react-router-dom';
import { CircleCheck } from 'lucide-react';
import { Card, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export function PedidoEnviadoPage() {
  const { state } = useLocation() as { state?: { whatsappUrl?: string } };
  const whatsappUrl = state?.whatsappUrl;

  return (
    <div className="mx-auto max-w-lg pt-6">
      <Card>
        <CardBody className="flex flex-col items-center gap-4 py-10 text-center">
          <CircleCheck size={48} className="text-success" aria-hidden="true" />
          <h1 className="text-2xl font-bold tracking-tight">¡Pedido enviado!</h1>
          <p className="max-w-sm text-text-soft">
            Recibimos tu consulta. Te vamos a contactar por WhatsApp para coordinar el pago y el
            envío. Si no se abrió WhatsApp, revisá que tengas la app instalada.
          </p>
          {whatsappUrl ? (
            <a href={whatsappUrl} target="_blank" rel="noreferrer">
              <Button>Abrir WhatsApp</Button>
            </a>
          ) : null}
          <Link to="/catalogo">
            <Button>Seguir viendo productos</Button>
          </Link>
        </CardBody>
      </Card>
    </div>
  );
}
