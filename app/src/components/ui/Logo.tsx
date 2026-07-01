import { cn } from '@/lib/utils';

type LogoVariant = 'principal' | 'accesorios';
type LogoSize = 'sm' | 'md' | 'lg' | 'xl';

interface LogoProps {
  /** "principal" (Tecnología Importada) o "accesorios" (subnegocio). */
  variant?: LogoVariant;
  size?: LogoSize;
  className?: string;
}

const textSize: Record<LogoSize, string> = {
  sm: 'text-base',
  md: 'text-lg',
  lg: 'text-2xl',
  xl: 'text-4xl md:text-5xl',
};
const dotSize: Record<LogoSize, string> = {
  sm: 'h-2 w-2',
  md: 'h-2.5 w-2.5',
  lg: 'h-3 w-3',
  xl: 'h-4 w-4',
};
const eyebrowSize: Record<LogoSize, string> = {
  sm: 'text-[10px]',
  md: 'text-xs',
  lg: 'text-sm',
  xl: 'text-base',
};

/**
 * Logo de marca de la app. Wordmark fiel al estilo Minimal premium, theme-aware
 * (usa los tokens, se adapta a claro/oscuro).
 *
 * - `principal`  → "Tecnología Importada" (vistas generales, nav, login, favicon).
 * - `accesorios` → subnegocio: eyebrow "Tecnología Importada" + "Accesorios".
 *
 * Los tiles oficiales (PNG) están en public/: /TIPrincipal.png y /TIAccesorios.png.
 * Se usan como <img> en home, login y favicon (principal) y en las vistas de
 * Accesorios (TIAccesorios.png).
 */
export function Logo({ variant = 'principal', size = 'md', className }: LogoProps) {
  if (variant === 'accesorios') {
    return (
      <span className={cn('inline-flex flex-col leading-none', className)} aria-label="Tecnología Importada Accesorios">
        <span className={cn('font-bold uppercase tracking-wider text-text-soft', eyebrowSize[size])}>
          Tecnología Importada
        </span>
        <span className={cn('inline-flex items-center gap-2 font-extrabold tracking-tight text-text', textSize[size])}>
          <span className={cn('rounded-full bg-accent', dotSize[size])} aria-hidden="true" />
          Accesorios
        </span>
      </span>
    );
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-2 font-extrabold tracking-tight text-text',
        textSize[size],
        className,
      )}
      aria-label="Tecnología Importada"
    >
      <span className={cn('shrink-0 rounded-full bg-accent', dotSize[size])} aria-hidden="true" />
      Tecnología Importada
    </span>
  );
}
