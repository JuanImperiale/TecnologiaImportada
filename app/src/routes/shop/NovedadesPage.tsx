import { Link } from 'react-router-dom';
import { useEffect, useMemo, useState, useRef } from 'react';
import { useNovedades } from '@/hooks/useNovedades';
import { Card, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { parseInstagramPostUrl } from '@/lib/instagram';

declare global {
  interface Window {
    instgrm?: { Embeds: { process: () => void } };
  }
}

const RETRY_DELAYS_MS = [800, 1800, 3200] as const;
const INSTAGRAM_EMBED_TIMEOUT_MS = 6000;
const VIDEO_EXT_RE = /\.(mp4|webm|ogg|mov|m4v)(?:$|[?#])/i;

type MediaKind = 'image' | 'video';

function inferMediaKind(url: string): MediaKind {
  return VIDEO_EXT_RE.test(url) ? 'video' : 'image';
}

function withRetryParam(url: string, retry: number): string {
  if (retry === 0) return url;
  try {
    const parsed = new URL(url);
    parsed.searchParams.set('_r', `${retry}-${Date.now()}`);
    return parsed.toString();
  } catch {
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}_r=${retry}-${Date.now()}`;
  }
}

function NovedadMedia({ mediaUrl, titulo }: { mediaUrl: string; titulo: string }) {
  const [mediaKind, setMediaKind] = useState<MediaKind>(() => inferMediaKind(mediaUrl));
  const [retryCount, setRetryCount] = useState(0);
  const [waitingRetry, setWaitingRetry] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setMediaKind(inferMediaKind(mediaUrl));
    setRetryCount(0);
    setWaitingRetry(false);
    setFailed(false);
  }, [mediaUrl]);

  const src = useMemo(() => withRetryParam(mediaUrl, retryCount), [mediaUrl, retryCount]);

  const scheduleRetry = () => {
    if (waitingRetry || failed) return;

    if (retryCount < RETRY_DELAYS_MS.length) {
      const delay = RETRY_DELAYS_MS[retryCount];
      setWaitingRetry(true);
      window.setTimeout(() => {
        setRetryCount((current) => current + 1);
        setWaitingRetry(false);
      }, delay);
      return;
    }

    if (mediaKind === 'image') {
      setMediaKind('video');
      setRetryCount(0);
      return;
    }

    setFailed(true);
  };

  if (failed) {
    return (
      <div className="flex min-h-48 items-center justify-center border-y border-line bg-surface-2 px-4 text-center text-sm text-text-soft">
        No se pudo cargar el contenido multimedia de esta novedad.
      </div>
    );
  }

  if (mediaKind === 'video') {
    return (
      <div className="relative w-full border-y border-line bg-black">
        <video
          key={`video-${src}`}
          className="h-auto w-full object-contain"
          controls
          playsInline
          preload="metadata"
          onLoadedData={() => setWaitingRetry(false)}
          onError={scheduleRetry}
        >
          <source src={src} />
          Tu navegador no soporta video.
        </video>
      </div>
    );
  }

  return (
    <div className="relative w-full border-y border-line bg-surface-2">
      <img
        key={`image-${src}`}
        src={src}
        alt={titulo}
        className="h-auto w-full object-contain"
        loading="lazy"
        onLoad={() => setWaitingRetry(false)}
        onError={scheduleRetry}
      />
    </div>
  );
}

function InstagramEmbed({ embedUrl, canonicalUrl, titulo }: { embedUrl: string; canonicalUrl: string; titulo: string }) {
  const [loaded, setLoaded] = useState(false);
  const [timedOut, setTimedOut] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [embedFailed, setEmbedFailed] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Lazy load: solo cargar cuando el usuario puede verlo (Intersection Observer)
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(container);
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(container);

    return () => {
      observer.unobserve(container);
    };
  }, []);

  // Timeout solo si está visible
  useEffect(() => {
    if (!isVisible || embedFailed) return;

    setLoaded(false);
    setTimedOut(false);
    const timerId = window.setTimeout(() => {
      setTimedOut(true);
    }, INSTAGRAM_EMBED_TIMEOUT_MS);

    return () => {
      window.clearTimeout(timerId);
    };
  }, [embedUrl, isVisible, embedFailed]);

  // Cargar script oficial de Instagram
  useEffect(() => {
    if (!isVisible || embedFailed) return;

    const script = document.createElement('script');
    script.src = 'https://www.instagram.com/embed.js';
    script.async = true;
    document.body.appendChild(script);

    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, [isVisible, embedFailed]);

  const handleLoad = () => {
    setLoaded(true);
    setTimedOut(false);
    if (window.instgrm) {
      window.instgrm.Embeds.process();
    }
  };

  const handleEmbedError = () => {
    setEmbedFailed(true);
  };

  // Si Instagram rechaza el embed (500 error, CORS, etc), mostrar fallback visual
  if (embedFailed || (timedOut && !loaded)) {
    return (
      <div ref={containerRef} className="w-full overflow-hidden border-y border-line bg-gradient-to-br from-surface-2 to-surface">
        <a
          href={canonicalUrl}
          target="_blank"
          rel="noreferrer"
          className="block w-full"
        >
          <div className="flex flex-col items-center justify-center gap-3 sm:gap-4 px-4 py-8 sm:py-12 text-center">
            {/* Instagram Icon */}
            <div className="flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 via-pink-500 to-purple-600">
              <svg className="h-8 w-8 sm:h-10 sm:w-10 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm6.066 3.972c.604.101 1.283.203 2.002.203.719 0 1.398-.102 2.002-.203v2.881c-.604.101-1.283.203-2.002.203-.719 0-1.398-.102-2.002-.203V3.972zM12 5.556c3.596 0 6.528 2.932 6.528 6.528s-2.932 6.528-6.528 6.528S5.472 15.612 5.472 12 8.404 5.556 12 5.556zm0 10.944c2.454 0 4.416-1.962 4.416-4.416s-1.962-4.416-4.416-4.416-4.416 1.962-4.416 4.416 1.962 4.416 4.416 4.416z" />
              </svg>
            </div>

            {/* Content */}
            <div>
              <p className="mb-1 sm:mb-2 text-xs sm:text-sm font-semibold text-accent">Instagram</p>
              <h3 className="mb-2 sm:mb-3 line-clamp-2 text-base sm:text-lg font-bold text-text">{titulo}</h3>
              <p className="mb-3 sm:mb-4 text-xs sm:text-sm text-text-soft">No pudimos cargar la publicación ahora. Tap para verla en Instagram</p>
            </div>

            {/* CTA Button */}
            <div className="inline-flex items-center gap-2 rounded-full bg-accent px-4 sm:px-6 py-2 sm:py-3 text-xs sm:text-sm font-semibold text-on-accent transition group-hover:brightness-110">
              <svg className="h-4 w-4 sm:h-5 sm:w-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.765 8.035 11.591.6.111.82-.261.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.73.083-.73 1.205.085 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.605-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 21.795 24 17.365 24 12c0-6.63-5.37-12-12-12z" />
              </svg>
              Ver publicación
            </div>
          </div>
        </a>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="w-full overflow-hidden border-y border-line bg-surface-2">
      <div className="relative w-full aspect-[4/7] sm:aspect-[5/8]">
        {/* Solo renderizar iframe si está visible y no ha fallado */}
        {isVisible && !embedFailed && (
          <iframe
            title={`Instagram: ${titulo}`}
            src={embedUrl}
            loading="lazy"
            className="absolute inset-0 h-full w-full border-0"
            onLoad={handleLoad}
            onError={handleEmbedError}
            allowFullScreen
            allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
          />
        )}

        {/* Estado de carga */}
        {isVisible && !loaded && !timedOut && !embedFailed && (
          <div className="absolute inset-0 flex items-center justify-center bg-surface-2/50 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-2">
              <div className="h-8 w-8 animate-spin rounded-full border-3 border-accent/30 border-t-accent" />
              <p className="text-xs text-text-soft">Cargando publicación...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function NovedadesPage() {
  const { novedades, loading } = useNovedades();

  if (loading) {
    return <Spinner className="min-h-[40vh]" />;
  }

  if (novedades.length === 0) {
    return (
      <EmptyState
        title="No hay novedades"
        description="Volvé más tarde para ver nuestros últimos contenidos y promociones."
      />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col items-center gap-2 text-center">
        {/* <h1 className="text-[clamp(2rem,3.5vw,3rem)] font-extrabold tracking-tight">Novedades</h1> */}
      </div>

      <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2">
        {novedades.map((novedad) => {
          const instagramParsed =
            novedad.tipo === 'instagram' && novedad.instagramPostUrl
              ? parseInstagramPostUrl(novedad.instagramPostUrl)
              : null;

          return (
          <Card key={novedad.id} className="overflow-hidden hover:shadow-md transition-shadow">
            <CardBody className="flex flex-col gap-0 p-0">
              {/* Título y descripción SIEMPRE arriba */}
              <div className="flex flex-col gap-1 sm:gap-2 px-4 sm:px-5 pt-4 sm:pt-5 pb-3 sm:pb-4">
                <h3 className="text-center text-lg sm:text-xl font-bold">{novedad.titulo}</h3>
                {novedad.texto && <p className="text-text-soft text-sm leading-relaxed">{novedad.texto}</p>}
              </div>

              {/* Media container */}
              {novedad.tipo === 'imagen' && novedad.mediaUrl && (
                <NovedadMedia mediaUrl={novedad.mediaUrl} titulo={novedad.titulo} />
              )}

              {novedad.tipo === 'instagram' && instagramParsed && (
                <InstagramEmbed
                  embedUrl={instagramParsed.embedUrl}
                  canonicalUrl={instagramParsed.canonicalUrl}
                  titulo={novedad.titulo}
                />
              )}

              {((novedad.tipo === 'imagen' && !novedad.mediaUrl) ||
                (novedad.tipo === 'instagram' && !instagramParsed)) && (
                <div className="flex min-h-48 items-center justify-center border-y border-line bg-surface-2 px-4 text-center text-sm text-text-soft">
                  No se pudo cargar el contenido multimedia de esta novedad.
                </div>
              )}

              {/* CTA */}
              {novedad.ctaLabel && novedad.ctaUrl && (
                <div className="px-4 sm:px-5 pb-4 sm:pb-5 pt-3 sm:pt-4">
                  <Link to={novedad.ctaUrl}>
                    <Button variant="ghost" size="sm" className="w-full text-xs sm:text-sm">
                      {novedad.ctaLabel}
                    </Button>
                  </Link>
                </div>
              )}
            </CardBody>
          </Card>
          );
        })}
      </div>
    </div>
  );
}
