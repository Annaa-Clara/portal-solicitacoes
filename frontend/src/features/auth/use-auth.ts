import { createContext, useContext } from 'react';
import type { Usuario } from '@/types/api';

export interface AuthContexto {
  usuario: Usuario | null;
  carregando: boolean;
  entrar: (usuario: string, senha: string) => Promise<Usuario>;
  sair: () => Promise<void>;
  saindo: boolean;
}

export const Contexto = createContext<AuthContexto | null>(null);

export function useAuth(): AuthContexto {
  const ctx = useContext(Contexto);
  if (!ctx) throw new Error('useAuth deve ser usado dentro de <AuthProvider>');
  return ctx;
}
