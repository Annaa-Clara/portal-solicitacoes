import { X } from 'lucide-react';
import { useEffect, useId, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';

interface DialogoProps {
  aberto: boolean;
  aoFechar: () => void;
  titulo: string;
  descricao?: ReactNode;
  children?: ReactNode;
  rodape?: ReactNode;
  className?: string;
}

/** Diálogo modal acessível: foco inicial, Esc para fechar, rolagem do fundo bloqueada. */
export function Dialogo({ aberto, aoFechar, titulo, descricao, children, rodape, className }: DialogoProps) {
  const idTitulo = useId();
  const painel = useRef<HTMLDivElement>(null);
  const fecharRef = useRef(aoFechar);
  fecharRef.current = aoFechar;

  useEffect(() => {
    if (!aberto) return;
    const anterior = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const focavel = painel.current?.querySelector<HTMLElement>(
      'textarea, input, select, button:not([data-fechar])',
    );
    (focavel ?? painel.current)?.focus();

    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key === 'Escape') fecharRef.current();
      if (e.key === 'Tab' && painel.current) {
        const itens = painel.current.querySelectorAll<HTMLElement>(
          'button:not(:disabled), textarea, input, select, a[href]',
        );
        if (!itens.length) return;
        const primeiro = itens[0];
        const ultimo = itens[itens.length - 1];
        if (e.shiftKey && document.activeElement === primeiro) {
          e.preventDefault();
          ultimo.focus();
        } else if (!e.shiftKey && document.activeElement === ultimo) {
          e.preventDefault();
          primeiro.focus();
        }
      }
    };
    document.addEventListener('keydown', aoTeclar);
    return () => {
      document.removeEventListener('keydown', aoTeclar);
      document.body.style.overflow = overflow;
      anterior?.focus();
    };
  }, [aberto]);

  if (!aberto) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4">
      <div
        className="absolute inset-0 animate-fade-in bg-slate-950/50 backdrop-blur-[2px]"
        onClick={aoFechar}
        aria-hidden
      />
      <div
        ref={painel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={idTitulo}
        tabIndex={-1}
        className={cn(
          'relative w-full animate-zoom-in rounded-t-2xl border border-borda bg-superficie p-6 shadow-flutuante sm:max-w-md sm:rounded-2xl',
          className,
        )}
      >
        <button
          type="button"
          data-fechar
          onClick={aoFechar}
          className="absolute right-4 top-4 rounded-lg p-1 text-suave transition hover:bg-elevada hover:text-texto"
          aria-label="Fechar"
        >
          <X className="h-4 w-4" />
        </button>
        <h2 id={idTitulo} className="pr-8 text-lg font-semibold">
          {titulo}
        </h2>
        {descricao && <div className="mt-1.5 text-sm text-suave">{descricao}</div>}
        {children && <div className="mt-5">{children}</div>}
        {rodape && (
          <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">{rodape}</div>
        )}
      </div>
    </div>,
    document.body,
  );
}
