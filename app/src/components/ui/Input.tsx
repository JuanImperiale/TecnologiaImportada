import { forwardRef, useState, type InputHTMLAttributes } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, className, id, type = 'text', ...props },
  ref,
) {
  const inputId = id ?? props.name;
  const isPassword = type === 'password';
  const [reveal, setReveal] = useState(false);
  const effectiveType = isPassword ? (reveal ? 'text' : 'password') : type;

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-text-soft">
          {label}
        </label>
      )}
      <div className="relative">
        <input
          ref={ref}
          id={inputId}
          type={effectiveType}
          aria-invalid={!!error}
          className={cn(
            'h-11 w-full rounded-md border bg-surface-2 px-3.5 text-[15px] text-text placeholder:text-text-faint',
            'transition-colors focus:outline-none focus-visible:outline-none',
            isPassword && 'pr-11',
            error ? 'border-danger' : 'border-line focus:border-line-strong',
            className,
          )}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setReveal((v) => !v)}
            aria-label={reveal ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            title={reveal ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            tabIndex={-1}
            className="absolute right-1 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-md text-text-soft hover:text-text"
          >
            {reveal ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
          </button>
        )}
      </div>
      {error && <span className="text-sm text-danger">{error}</span>}
    </div>
  );
});
