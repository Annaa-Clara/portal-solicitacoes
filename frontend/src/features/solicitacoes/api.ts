import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type {
  Categoria,
  Dashboard,
  FiltroSolicitacoes,
  Pagina,
  SalvarSolicitacao,
  SolicitacaoDetalhe,
  SolicitacaoItem,
  Status,
} from '@/types/api';

export const chaves = {
  categorias: ['categorias'] as const,
  dashboard: ['dashboard'] as const,
  listas: ['solicitacoes', 'lista'] as const,
  lista: (filtro: FiltroSolicitacoes) => ['solicitacoes', 'lista', filtro] as const,
  detalhe: (id: number) => ['solicitacoes', 'detalhe', id] as const,
};

export function useCategorias() {
  return useQuery({
    queryKey: chaves.categorias,
    queryFn: ({ signal }) => api.get<Categoria[]>('/categorias', undefined, signal),
    staleTime: 10 * 60_000,
  });
}

export function useDashboard() {
  return useQuery({
    queryKey: chaves.dashboard,
    queryFn: ({ signal }) => api.get<Dashboard>('/dashboard', undefined, signal),
  });
}

export function useSolicitacoes(filtro: FiltroSolicitacoes) {
  return useQuery({
    queryKey: chaves.lista(filtro),
    queryFn: ({ signal }) => api.get<Pagina<SolicitacaoItem>>('/solicitacoes', { ...filtro }, signal),
    placeholderData: keepPreviousData, // mantém a tabela enquanto a próxima página carrega
  });
}

export function useSolicitacao(id: number) {
  return useQuery({
    queryKey: chaves.detalhe(id),
    queryFn: ({ signal }) => api.get<SolicitacaoDetalhe>(`/solicitacoes/${id}`, undefined, signal),
    enabled: Number.isInteger(id) && id > 0,
  });
}

/** Após qualquer escrita: atualiza o detalhe em cache e invalida listas e dashboard. */
function useAposEscrita() {
  const qc = useQueryClient();
  return (detalhe?: SolicitacaoDetalhe) => {
    if (detalhe) qc.setQueryData(chaves.detalhe(detalhe.id), detalhe);
    void qc.invalidateQueries({ queryKey: chaves.listas });
    void qc.invalidateQueries({ queryKey: chaves.dashboard });
  };
}

export function useCriarSolicitacao() {
  const apos = useAposEscrita();
  return useMutation({
    mutationFn: (dados: SalvarSolicitacao) => api.post<SolicitacaoDetalhe>('/solicitacoes', dados),
    onSuccess: apos,
  });
}

export function useAtualizarSolicitacao(id: number) {
  const apos = useAposEscrita();
  return useMutation({
    mutationFn: (dados: SalvarSolicitacao) => api.put<SolicitacaoDetalhe>(`/solicitacoes/${id}`, dados),
    onSuccess: apos,
  });
}

export function useExcluirSolicitacao() {
  const apos = useAposEscrita();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.delete(`/solicitacoes/${id}`),
    onSuccess: (_r, id) => {
      qc.removeQueries({ queryKey: chaves.detalhe(id) });
      apos();
    },
  });
}

export function useAlterarStatus(id: number) {
  const apos = useAposEscrita();
  return useMutation({
    mutationFn: (dados: { status: Status; observacao?: string }) =>
      api.patch<SolicitacaoDetalhe>(`/solicitacoes/${id}/status`, dados),
    onSuccess: apos,
  });
}
