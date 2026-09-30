import { Perfil, StatusSolicitacao } from '../../../common/enums';

/**
 * Regras de negócio da solicitação, isoladas em funções puras.
 * Não dependem de framework nem de banco: são a parte mais testada do sistema
 * e a fonte única de verdade para backend e frontend (via "permissoes").
 */

/** Máquina de estados: para quais status cada status pode evoluir. */
export const TRANSICOES: Readonly<Record<StatusSolicitacao, readonly StatusSolicitacao[]>> = {
  [StatusSolicitacao.ABERTO]: [StatusSolicitacao.EM_ATENDIMENTO],
  // Devolver para ABERTO permite ao solicitante complementar a demanda.
  [StatusSolicitacao.EM_ATENDIMENTO]: [StatusSolicitacao.CONCLUIDO, StatusSolicitacao.ABERTO],
  // Estado final: uma nova necessidade vira uma nova solicitação.
  [StatusSolicitacao.CONCLUIDO]: [],
};

export const ROTULO_STATUS: Readonly<Record<StatusSolicitacao, string>> = {
  [StatusSolicitacao.ABERTO]: 'Aberto',
  [StatusSolicitacao.EM_ATENDIMENTO]: 'Em Atendimento',
  [StatusSolicitacao.CONCLUIDO]: 'Concluído',
};

export interface Ator {
  id: number;
  perfil: Perfil;
}

export interface SolicitacaoResumo {
  solicitanteId: number;
  status: StatusSolicitacao;
}

export function transicaoValida(de: StatusSolicitacao, para: StatusSolicitacao): boolean {
  return TRANSICOES[de].includes(para);
}

/** Observação obrigatória quando a solicitação volta para a fila do solicitante. */
export function exigeObservacao(de: StatusSolicitacao, para: StatusSolicitacao): boolean {
  return de === StatusSolicitacao.EM_ATENDIMENTO && para === StatusSolicitacao.ABERTO;
}

export function podeVisualizar(ator: Ator, s: SolicitacaoResumo): boolean {
  return ator.perfil === Perfil.ATENDENTE || s.solicitanteId === ator.id;
}

/** Edição e exclusão: apenas pelo próprio solicitante e enquanto estiver aberta. */
export function podeModificar(ator: Ator, s: SolicitacaoResumo): boolean {
  return s.solicitanteId === ator.id && s.status === StatusSolicitacao.ABERTO;
}

export function podeAlterarStatus(ator: Ator): boolean {
  return ator.perfil === Perfil.ATENDENTE;
}

export function transicoesPermitidas(ator: Ator, s: SolicitacaoResumo): StatusSolicitacao[] {
  return podeAlterarStatus(ator) ? [...TRANSICOES[s.status]] : [];
}

export function formatarCodigo(id: number): string {
  return `SOL-${String(id).padStart(6, '0')}`;
}

/** Aceita "SOL-000042", "sol-42" ou "42" e devolve o id numérico. */
export function extrairIdDoCodigo(termo: string): number | null {
  const match = /^\s*(?:sol-?)?0*(\d{1,12})\s*$/i.exec(termo);
  return match ? Number(match[1]) : null;
}
