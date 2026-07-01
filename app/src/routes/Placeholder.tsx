import { Hammer } from 'lucide-react';
import { EmptyState } from '@/components/ui/EmptyState';

/** Página temporal para rutas que se construyen en fases posteriores. */
export function Placeholder({ title, fase }: { title: string; fase?: string }) {
  return (
    <div className="mx-auto max-w-xl py-6">
      <h1 className="mb-4 text-2xl font-bold tracking-tight">{title}</h1>
      <EmptyState
        icon={<Hammer size={36} />}
        title="En construcción"
        description={
          fase
            ? `Esta vista se desarrolla en la ${fase} del plan.`
            : 'Esta vista se desarrolla en una fase posterior del plan.'
        }
      />
    </div>
  );
}
