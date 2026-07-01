import { forwardRef, type TextareaHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, error, className, id, ...props },
  ref,
) {
  const taId = id ?? props.name;
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={taId} className="text-sm font-medium text-text-soft">
          {label}
        </label>
      )}
      <textarea
        ref={ref}
        id={taId}
        aria-invalid={!!error}
        className={cn(
          'min-h-[88px] w-full rounded-md border bg-surface-2 px-3.5 py-2.5 text-[15px] text-text placeholder:text-text-faint',
          'transition-colors focus:outline-none focus-visible:outline-none',
          error ? 'border-danger' : 'border-line focus:border-line-strong',
          className,
        )}
        {...props}
      />
      {error && <span className="text-sm text-danger">{error}</span>}
    </div>
  );
});
