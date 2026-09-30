import {
  forwardRef,
  useId,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

const BASE =
  'w-full rounded-xl border border-borda bg-superficie px-3.5 text-sm text-texto shadow-sm transition placeholder:text-suave/70 hover:border-suave/40 focus:border-marca focus:outline-none focus:ring-4 focus:ring-marca/15 disabled:cursor-not-allowed disabled:opacity-60 aria-[invalid=true]:border-perigo aria-[invalid=true]:focus:ring-perigo/15';

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => <input ref={ref} className={cn(BASE, 'h-10', className)} {...props} />,
);
Input.displayName = 'Input';

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(BASE, 'min-h-32 resize-y py-2.5 leading-relaxed', className)}
      {...props}
    />
  ),
);
Textarea.displayName = 'Textarea';

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, children, ...props }, ref) => (
    <div className="relative">
      <select ref={ref} className={cn(BASE, 'h-10 appearance-none pr-9', className)} {...props}>
        {children}
      </select>
      <ChevronDown
        className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-suave"
        aria-hidden
      />
    </div>
  ),
);
Select.displayName = 'Select';

interface CampoProps {
  rotulo: string;
  erro?: string;
  dica?: ReactNode;
  obrigatorio?: boolean;
  className?: string;
  children: (props: { id: string; 'aria-invalid': boolean; 'aria-describedby'?: string }) => ReactNode;
}

/** Envolve um controle com rótulo, dica e mensagem de erro acessíveis. */
export function Campo({ rotulo, erro, dica, obrigatorio, className, children }: CampoProps) {
  const id = useId();
  const idAjuda = `${id}-ajuda`;
  return (
    <div className={cn('space-y-1.5', className)}>
      <label htmlFor={id} className="block text-sm font-medium text-texto">
        {rotulo}
        {obrigatorio && (
          <span className="ml-0.5 text-perigo" aria-hidden>
            *
          </span>
        )}
      </label>
      {children({
        id,
        'aria-invalid': Boolean(erro),
        'aria-describedby': erro || dica ? idAjuda : undefined,
      })}
      {(erro || dica) && (
        <p
          id={idAjuda}
          className={cn('text-xs', erro ? 'text-perigo' : 'text-suave')}
          role={erro ? 'alert' : undefined}
        >
          {erro ?? dica}
        </p>
      )}
    </div>
  );
}
