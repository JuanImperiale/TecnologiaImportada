import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Spinner({ className, size = 24 }: { className?: string; size?: number }) {
  return (
    <div className={cn('flex items-center justify-center p-6 text-text-soft', className)}>
      <Loader2 size={size} className="animate-spin" aria-label="Cargando" />
    </div>
  );
}
