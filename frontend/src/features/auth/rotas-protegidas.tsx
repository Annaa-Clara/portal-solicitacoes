import { Loader2 } from 'lucide-react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import type { Perfil } from '@/types/api';
import { useAuth } from './use-auth';

function TelaCarregando() {
  return (
    <div className="grid min-h-dvh place-items-center" role="status">
      <Loader2 className="h-6 w-6 animate-spin text-marca" aria-label="Carregando" />
    </div>
  );
}

/** Só renderiza as rotas filhas com sessão válida (e, opcionalmente, perfil permitido). */
export function RotaProtegida({ perfis }: { perfis?: Perfil[] }) {
  const { usuario, carregando } = useAuth();
  const local = useLocation();

  if (carregando) return <TelaCarregando />;
  if (!usuario) {
    return <Navigate to="/login" replace state={{ de: local.pathname + local.search }} />;
  }
  if (perfis && !perfis.includes(usuario.perfil)) return <Navigate to="/" replace />;
  return <Outlet />;
}

export function RotaPublica() {
  const { usuario, carregando } = useAuth();
  if (carregando) return <TelaCarregando />;
  return usuario ? <Navigate to="/" replace /> : <Outlet />;
}
