import type { Status } from '@/types/api';

export const STATUS: Record<
  Status,
  { rotulo: string; acao: string; classe: string; ponto: string; cor: string }
> = {
  ABERTO: {
    rotulo: 'Aberto',
    acao: 'Devolver para Aberto',
    classe:
      'bg-amber-50 text-amber-800 ring-amber-600/20 dark:bg-amber-400/10 dark:text-amber-300 dark:ring-amber-400/25',
    ponto: 'bg-amber-500',
    cor: '#f59e0b',
  },
  EM_ATENDIMENTO: {
    rotulo: 'Em Atendimento',
    acao: 'Iniciar atendimento',
    classe:
      'bg-sky-50 text-sky-800 ring-sky-600/20 dark:bg-sky-400/10 dark:text-sky-300 dark:ring-sky-400/25',
    ponto: 'bg-sky-500',
    cor: '#0ea5e9',
  },
  CONCLUIDO: {
    rotulo: 'Concluído',
    acao: 'Concluir solicitação',
    classe:
      'bg-emerald-50 text-emerald-800 ring-emerald-600/20 dark:bg-emerald-400/10 dark:text-emerald-300 dark:ring-emerald-400/25',
    ponto: 'bg-emerald-500',
    cor: '#10b981',
  },
};

export const LISTA_STATUS: Status[] = ['ABERTO', 'EM_ATENDIMENTO', 'CONCLUIDO'];
