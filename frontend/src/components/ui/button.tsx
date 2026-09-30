import { Loader2 } from 'lucide-react';
import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { Link, type LinkProps } from 'react-router-dom';
import { cn } from '@/lib/utils';

const VARIANTES = {
  primario:
    'bg-marca text-white shadow-sm hover:bg-marca-forte dark:text-slate-950 dark:hover:bg-marca-forte',
  secundario: 'border border-borda bg-superficie text-texto shadow-sm hover:bg-elevada',
  fantasma: 'text-suave hover:bg-elevada hover:text-texto',
  perigo: 'bg-perigo text-white shadow-sm hover:bg-perigo/90',
} as const;

const TAMANHOS = {
  sm: 'h-8 gap-1.5 rounded-lg px-3 text-xs',
  md: 'h-10 gap-2 rounded-xl px-4 text-sm',
  lg: 'h-11 gap-2 rounded-xl px-5 text-sm',
  icone: 'h-9 w-9 rounded-xl',
} as const;

const BASE =
  'inline-flex shrink-0 items-center justify-center whitespace-nowrap font-medium transition-colors disabled:pointer-events-none disabled:opacity-50';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: keyof typeof VARIANTES;
  tamanho?: keyof typeof TAMANHOS;
  carregando?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variante = 'primario', tamanho = 'md', carregando, disabled, children, ...props }, ref) => (
    <button
      ref={ref}
      disabled={disabled || carregando}
      aria-busy={carregando || undefined}
      className={cn(BASE, VARIANTES[variante], TAMANHOS[tamanho], className)}
      {...props}
    >
      {carregando && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
      {children}
    </button>
  ),
);
Button.displayName = 'Button';

interface LinkBotaoProps extends LinkProps {
  variante?: keyof typeof VARIANTES;
  tamanho?: keyof typeof TAMANHOS;
}

/** Link com aparência de botão (evita aninhar <button> dentro de <a>). */
export function LinkBotao({ variante = 'primario', tamanho = 'md', className, ...props }: LinkBotaoProps) {
  return <Link className={cn(BASE, VARIANTES[variante], TAMANHOS[tamanho], className)} {...props} />;
}
