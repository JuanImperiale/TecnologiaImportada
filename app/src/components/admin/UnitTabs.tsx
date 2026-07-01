import { cn } from '@/lib/utils';
import type { Negocio } from '@/models';

const UNITS: { value: Negocio; label: string }[] = [
  { value: 'productos', label: 'Productos' },
  { value: 'accesorios', label: 'Accesorios' },
];

/** Pestañas para alternar entre las dos unidades de negocio. */
export function UnitTabs({
  value,
  onChange,
}: {
  value: Negocio;
  onChange: (n: Negocio) => void;
}) {
  return (
    <div className="inline-flex rounded-pill border border-line bg-surface-2 p-1">
      {UNITS.map((u) => (
        <button
          key={u.value}
          type="button"
          onClick={() => onChange(u.value)}
          className={cn(
            'rounded-pill px-4 py-1.5 text-sm font-medium transition-colors',
            value === u.value ? 'bg-accent text-on-accent' : 'text-text-soft hover:text-text',
          )}
        >
          {u.label}
        </button>
      ))}
    </div>
  );
}
