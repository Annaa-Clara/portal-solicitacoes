import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ApiError } from './api';

export const CHAVE_SESSAO = ['sessao'] as const;

/**
 * Sessão expirada em qualquer requisição -> limpa o usuário em cache;
 * a rota protegida então redireciona para o login.
 */
function tratarNaoAutenticado(erro: unknown, chave?: readonly unknown[]) {
  if (erro instanceof ApiError && erro.status === 401 && chave?.[0] !== CHAVE_SESSAO[0]) {
    if (queryClient.getQueryData(CHAVE_SESSAO)) {
      toast.warning('Sua sessão expirou. Entre novamente para continuar.');
    }
    queryClient.setQueryData(CHAVE_SESSAO, null);
  }
}

export const queryClient: QueryClient = new QueryClient({
  queryCache: new QueryCache({ onError: (erro, query) => tratarNaoAutenticado(erro, query.queryKey) }),
  mutationCache: new MutationCache({ onError: (erro) => tratarNaoAutenticado(erro, ['mutacao']) }),
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: true,
      retry: (tentativas, erro) =>
        !(erro instanceof ApiError && erro.status >= 400 && erro.status < 500) && tentativas < 2,
    },
  },
});
