import { Link } from 'react-router-dom';
import { useCatalog } from '@/hooks/useCatalog';
import { FeaturedCarousel } from '@/components/shop/FeaturedCarousel';
import { NovedadesPopup } from '@/components/shop/NovedadesPopup';
import { Card, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { useBusinessSettings } from '@/hooks/useBusinessSettings';

export function HomePage() {
  const { featured, loading } = useCatalog();
  const { settings, loading: settingsLoading } = useBusinessSettings();

  const heroTitulo = settings.heroTitulo ?? 'Tecnologia que si se siente premium.';
  const heroSubtitulo =
    settings.heroSubtitulo ??
    'Audio, carga rapida y accesorios originales. Stock real, garantia y precio claro.';

  return (
    <div className="flex flex-col gap-8">
      <NovedadesPopup />
      
      {/* Hero */}
      <Card className="overflow-hidden">
        <CardBody className="flex flex-col gap-4 p-5 md:gap-6 md:p-6">
          {/* Mobile: solo logos */}
          <div className="grid grid-cols-2 gap-3 md:hidden">
            <div className="flex justify-center">
              <Link to="/catalogo?unidad=productos" aria-label="Ir a catálogo de productos">
                <img
                  src="/TIPrincipal.png"
                  alt="TI Principal"
                  className="w-full max-w-[170px] rounded-lg object-contain"
                />
              </Link>
            </div>
            <div className="flex justify-center">
              <Link to="/catalogo?unidad=accesorios" aria-label="Ir a catálogo de accesorios">
                <img
                  src="/TIAccesorios.png"
                  alt="TI Accesorios"
                  className="w-full max-w-[170px] rounded-lg object-contain"
                />
              </Link>
            </div>
          </div>

          {/* Desktop: logos a los lados + contenido centrado */}
          <div className="hidden md:grid md:grid-cols-[210px_minmax(0,1fr)_210px] md:items-center md:gap-6 lg:grid-cols-[230px_minmax(0,1fr)_230px]">
            <div className="flex justify-start">
              <Link to="/catalogo?unidad=productos" aria-label="Ir a catálogo de productos">
                <img
                  src="/TIPrincipal.png"
                  alt="TI Principal"
                  className="w-full max-w-[190px] rounded-lg object-contain lg:max-w-[220px]"
                />
              </Link>
            </div>

            <div className="flex min-w-0 flex-col items-center gap-4 text-center">
              <Badge tone="neutral">Villa Mercedes, San Luis</Badge>
              {settingsLoading ? (
                <div className="w-full min-w-0 max-w-none">
                  <div className="mx-auto h-12 w-[clamp(16rem,60%,28rem)] animate-pulse rounded-md bg-surface-2" />
                </div>
              ) : (
                <h1 className="w-full min-w-0 max-w-none text-[clamp(2rem,3.2vw,3rem)] font-extrabold leading-[1.02] tracking-tight whitespace-nowrap">
                  {heroTitulo}
                </h1>
              )}

              {settingsLoading ? (
                <div className="mx-auto h-5 w-[clamp(14rem,50%,24rem)] animate-pulse rounded-md bg-surface-2" />
              ) : (
                <p className="max-w-[50ch] text-text-soft">{heroSubtitulo}</p>
              )}
              <div className="flex flex-wrap justify-center gap-3">
                <Link to="/catalogo">
                  <Button>Ver catálogo</Button>
                </Link>
                <Link to="/contacto">
                  <Button variant="ghost">Contacto</Button>
                </Link>
              </div>
            </div>

            <div className="flex justify-end">
              <Link to="/catalogo?unidad=accesorios" aria-label="Ir a catálogo de accesorios">
                <img
                  src="/TIAccesorios.png"
                  alt="TI Accesorios"
                  className="w-full max-w-[190px] rounded-lg object-contain lg:max-w-[220px]"
                />
              </Link>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Destacados */}
      <section>
        <div className="mb-4 flex flex-col items-center gap-2 text-center">
          <h2 className="text-2xl font-bold tracking-tight">Descatados</h2>
          <Link
            to="/catalogo"
            className="inline-flex h-11 items-center justify-center rounded-pill border border-line bg-surface-2 px-5 text-base font-bold text-text sm:hidden"
          >
            Ver catálogo
          </Link>
          <Link to="/catalogo" className="hidden text-sm font-medium text-text-soft hover:text-text sm:inline-flex">
            Ver todo →
          </Link>
        </div>
        {loading ? (
          <Spinner />
        ) : featured.length === 0 ? (
          <EmptyState
            title="Todavía no hay destacados"
            description="Marcá productos como destacados desde el panel para que aparezcan acá."
          />
        ) : (
          <FeaturedCarousel products={featured} />
        )}
      </section>
    </div>
  );
}
