export type Perfil = 'SOLICITANTE' | 'ATENDENTE';
export type Status = 'ABERTO' | 'EM_ATENDIMENTO' | 'CONCLUIDO';

export interface Usuario {
  id: number;
  nome: string;
  usuario: string;
  perfil: Perfil;
}

export interface Referencia {
  id: number;
  nome: string;
}

export interface Categoria {
  id: number;
  nome: string;
  descricao: string | null;
}

export interface SolicitacaoItem {
  id: number;
  codigo: string;
  titulo: string;
  categoria: Referencia;
  solicitante: Referencia;
  status: Status;
  criadoEm: string;
  atualizadoEm: string;
}

export interface Historico {
  id: number;
  statusAnterior: Status | null;
  statusNovo: Status;
  usuario: Referencia;
  observacao: string | null;
  criadoEm: string;
}

export interface Permissoes {
  podeEditar: boolean;
  podeExcluir: boolean;
  transicoesPermitidas: Status[];
}

export interface SolicitacaoDetalhe extends SolicitacaoItem {
  descricao: string;
  concluidoEm: string | null;
  historico: Historico[];
  permissoes: Permissoes;
}

export interface Pagina<T> {
  itens: T[];
  pagina: number;
  tamanho: number;
  total: number;
  totalPaginas: number;
}

export interface FiltroSolicitacoes {
  pagina?: number;
  tamanho?: number;
  status?: Status;
  categoriaId?: number;
  dataInicio?: string;
  dataFim?: string;
  texto?: string;
  ordenarPor?: 'criadoEm' | 'titulo' | 'status' | 'id';
  direcao?: 'asc' | 'desc';
}

export interface SalvarSolicitacao {
  titulo: string;
  descricao: string;
  categoriaId: number;
}

export interface Dashboard {
  indicadores: {
    total: number;
    abertas: number;
    emAtendimento: number;
    concluidas: number;
    tempoMedioConclusaoHoras: number | null;
  };
  porCategoria: {
    categoriaId: number;
    categoria: string;
    total: number;
    abertas: number;
    emAtendimento: number;
    concluidas: number;
  }[];
  evolucao: { dia: string; abertas: number; concluidas: number }[];
  recentes: SolicitacaoItem[];
}

export interface ErroCampo {
  campo: string;
  mensagem: string;
}

export interface ProblemDetails {
  title: string;
  status: number;
  detail: string;
  requestId?: string;
  erros?: ErroCampo[];
}
