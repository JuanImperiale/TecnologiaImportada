import { Link, isRouteErrorResponse, useRouteError } from 'react-router-dom';
import { Button } from '@/components/ui/Button';

export function RouteErrorBoundary() {
  const error = useRouteError();

  const title = isRouteErrorResponse(error)
    ? `${error.status} · ${error.statusText || 'Error de ruta'}`
    : 'Algo salio mal';
  const description = isRouteErrorResponse(error)
    ? error.data?.message || 'La ruta no pudo resolverse correctamente.'
    : error instanceof Error
      ? error.message
      : 'Ocurrio un error inesperado al renderizar esta vista.';

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-2xl font-extrabold tracking-tight">{title}</h1>
      <p className="max-w-lg text-sm leading-6 text-text-soft">{description}</p>
      <div className="flex flex-wrap justify-center gap-3">
        <Button onClick={() => window.location.reload()}>Recargar</Button>
        <Link to="/">
          <Button variant="ghost">Ir al inicio</Button>
        </Link>
      </div>
    </div>
  );
}