import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, type ReactNode } from 'react';
import { api, ApiError } from '@/lib/api';
import { CHAVE_SESSAO } from '@/lib/query-client';
import type { Usuario } from '@/types/api';
import { Contexto, type AuthContexto } from './use-auth';

async function buscarSessao(): Promise<Usuario | null> {
  try {
    return await api.get<Usuario>('/auth/me');
  } catch (erro) {
    if (erro instanceof ApiError && erro.status === 401) return null;
    throw erro;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const sessao = useQuery({ queryKey: CHAVE_SESSAO, queryFn: buscarSessao, staleTime: Infinity });

  const login = useMutation({
    mutationFn: (dados: { usuario: string; senha: string }) => api.post<Usuario>('/auth/login', dados),
    onSuccess: (usuario) => {
      queryClient.removeQueries({ predicate: (q) => q.queryKey[0] !== CHAVE_SESSAO[0] });
      queryClient.setQueryData(CHAVE_SESSAO, usuario);
    },
  });

  const logout = useMutation({
    mutationFn: () => api.post<void>('/auth/logout'),
    onSettled: () => {
      queryClient.clear();
      queryClient.setQueryData(CHAVE_SESSAO, null);
    },
  });

  const valor = useMemo<AuthContexto>(
    () => ({
      usuario: sessao.data ?? null,
      carregando: sessao.isPending,
      entrar: (usuario, senha) => login.mutateAsync({ usuario, senha }),
      sair: () => logout.mutateAsync().catch(() => undefined),
      saindo: logout.isPending,
    }),
    [sessao.data, sessao.isPending, login, logout],
  );

  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}
