import { CheckCircle2, CircleDot, Clock3, type LucideIcon } from 'lucide-react';
import { formatarDataHora, formatarRelativo } from '@/lib/formatacao';
import { STATUS } from '@/lib/status';
import { cn } from '@/lib/utils';
import type { Historico, Status } from '@/types/api';

const ICONE: Record<Status, LucideIcon> = {
  ABERTO: CircleDot,
  EM_ATENDIMENTO: Clock3,
  CONCLUIDO: CheckCircle2,
};

function descrever(h: Historico): string {
  if (h.statusAnterior === null) return 'registrou a solicitação';
  if (h.statusNovo === 'EM_ATENDIMENTO') return 'iniciou o atendimento';
  if (h.statusNovo === 'CONCLUIDO') return 'concluiu a solicitação';
  return 'devolveu a solicitação para Aberto';
}

/** Linha do tempo: cada mudança de status, quem fez, quando e por quê. */
export function LinhaDoTempo({ historico }: { historico: Historico[] }) {
  const eventos = [...historico].reverse(); // mais recente primeiro
  return (
    <ol className="relative">
      {eventos.map((h, i) => {
        const Icone = ICONE[h.statusNovo];
        const ultimo = i === eventos.length - 1;
        return (
          <li key={h.id} className="relative flex gap-4 pb-6 last:pb-0">
            {!ultimo && (
              <span className="absolute left-[15px] top-8 h-[calc(100%-2rem)] w-px bg-borda" aria-hidden />
            )}
            <span
              className={cn(
                'relative z-10 grid h-8 w-8 shrink-0 place-items-center rounded-full ring-4 ring-superficie',
                STATUS[h.statusNovo].classe,
              )}
            >
              <Icone className="h-4 w-4" aria-hidden />
            </span>
            <div className="min-w-0 flex-1 pt-1">
              <p className="text-sm">
                <span className="font-medium">{h.usuario.nome}</span>{' '}
                <span className="text-suave">{descrever(h)}</span>
              </p>
              <time dateTime={h.criadoEm} title={formatarDataHora(h.criadoEm)} className="text-xs text-suave">
                {formatarDataHora(h.criadoEm)} · {formatarRelativo(h.criadoEm)}
              </time>
              {h.observacao && (
                <p className="mt-2 whitespace-pre-line rounded-xl bg-elevada px-3 py-2 text-sm">
                  {h.observacao}
                </p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

const ETAPAS: Status[] = ['ABERTO', 'EM_ATENDIMENTO', 'CONCLUIDO'];

/** Indicador visual da etapa atual no fluxo de atendimento. */
export function ProgressoStatus({ status }: { status: Status }) {
  const atual = ETAPAS.indexOf(status);
  return (
    <ol className="flex items-center" aria-label={`Etapa atual: ${STATUS[status].rotulo}`}>
      {ETAPAS.map((etapa, i) => {
        const feito = i <= atual;
        return (
          <li key={etapa} className={cn('flex items-center', i < ETAPAS.length - 1 && 'flex-1')}>
            <div className="flex flex-col items-center gap-1.5">
              <span
                className={cn(
                  'grid h-7 w-7 place-items-center rounded-full text-xs font-semibold transition',
                  feito ? 'bg-marca text-white dark:text-slate-950' : 'bg-elevada text-suave',
                  i === atual && 'ring-4 ring-marca/20',
                )}
                aria-current={i === atual ? 'step' : undefined}
              >
                {i < atual ? '✓' : i + 1}
              </span>
              <span
                className={cn(
                  'whitespace-nowrap text-[11px]',
                  feito ? 'font-medium text-texto' : 'text-suave',
                )}
              >
                {STATUS[etapa].rotulo}
              </span>
            </div>
            {i < ETAPAS.length - 1 && (
              <span
                className={cn('mx-1 mb-5 h-0.5 flex-1 rounded', i < atual ? 'bg-marca' : 'bg-borda')}
                aria-hidden
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}
