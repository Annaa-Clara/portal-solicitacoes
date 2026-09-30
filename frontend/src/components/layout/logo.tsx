import { cn } from '@/lib/utils';

export function Logo({ claro, compacto }: { claro?: boolean; compacto?: boolean }) {
  return (
    <div className="relative flex items-center gap-2.5">
      <svg viewBox="0 0 32 32" className="h-9 w-9 shrink-0" aria-hidden>
        <rect width="32" height="32" rx="9" className={claro ? 'fill-white/15' : 'fill-marca'} />
        <path d="M9 11.5h14M9 16h9M9 20.5h6" stroke="white" strokeWidth="2.4" strokeLinecap="round" />
        <circle cx="22.5" cy="20.5" r="3" className={claro ? 'fill-sky-300' : 'fill-sky-300'} />
      </svg>
      {!compacto && (
        <div className="leading-tight">
          <p className={cn('text-[15px] font-semibold tracking-tight', claro ? 'text-white' : 'text-texto')}>
            Portal de Solicitações
          </p>
          <p className={cn('text-xs', claro ? 'text-blue-100/70' : 'text-suave')}>Demandas internas</p>
        </div>
      )}
    </div>
  );
}
