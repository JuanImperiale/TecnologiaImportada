import type { ReactNode } from 'react';
import { Inbox } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
}

export function EmptyState({ title, description, icon, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-line p-10 text-center">
      <div className="text-text-faint" aria-hidden="true">
        {icon ?? <Inbox size={36} />}
      </div>
      <div>
        <p className="font-medium text-text">{title}</p>
        {description && <p className="mt-1 text-sm text-text-soft">{description}</p>}
      </div>
      {action}
    </div>
  );
}
