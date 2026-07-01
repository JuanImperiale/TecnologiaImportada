import { Monitor, Moon, Sun, type LucideIcon } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import type { ThemeMode } from '@/providers/ThemeProvider';
import { cn } from '@/lib/utils';

const OPTIONS: { value: ThemeMode; label: string; icon: LucideIcon }[] = [
  { value: 'light', label: 'Claro', icon: Sun },
  { value: 'dark', label: 'Oscuro', icon: Moon },
  { value: 'system', label: 'Sistema', icon: Monitor },
];

/** Selector segmentado de tema: claro / oscuro / sistema. */
export function ThemeToggle() {
  const { mode, setMode } = useTheme();
  return (
    <div
      role="radiogroup"
      aria-label="Tema"
      className="inline-flex items-center gap-1 rounded-pill border border-line bg-surface-2 p-1"
    >
      {OPTIONS.map(({ value, label, icon: Icon }) => {
        const active = mode === value;
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={label}
            title={label}
            onClick={() => setMode(value)}
            className={cn(
              'flex h-8 w-8 items-center justify-center rounded-pill transition-colors',
              active ? 'bg-accent text-on-accent' : 'text-text-soft hover:text-text',
            )}
          >
            <Icon size={16} aria-hidden="true" />
          </button>
        );
      })}
    </div>
  );
}
