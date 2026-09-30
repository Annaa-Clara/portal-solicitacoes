import { lazy, Suspense } from 'react';
import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom';
import { Compass, Loader2 } from 'lucide-react';
import { AppLayout } from '@/components/layout/app-layout';
import { LinkBotao } from '@/components/ui/button';
import { EstadoVazio } from '@/components/ui/feedback';
import { LoginPage } from '@/features/auth/login-page';
import { RotaProtegida, RotaPublica } from '@/features/auth/rotas-protegidas';
import { DetalheSolicitacaoPage } from '@/features/solicitacoes/detalhe-page';
import { FormularioSolicitacaoPage } from '@/features/solicitacoes/formulario-page';
import { ListaSolicitacoesPage } from '@/features/solicitacoes/lista-page';

// O dashboard carrega a biblioteca de gráficos: é carregado sob demanda.
const DashboardPage = lazy(() =>
  import('@/features/dashboard/dashboard-page').then((m) => ({ default: m.DashboardPage })),
);

function Carregando() {
  return (
    <div className="grid h-64 place-items-center" role="status">
      <Loader2 className="h-6 w-6 animate-spin text-marca" aria-label="Carregando" />
    </div>
  );
}

function NaoEncontrada() {
  return (
    <div className="cartao">
      <EstadoVazio
        icone={Compass}
        titulo="Página não encontrada"
        descricao="O endereço acessado não existe."
        acao={<LinkBotao to="/">Ir para o início</LinkBotao>}
      />
    </div>
  );
}

const router = createBrowserRouter([
  {
    element: <RotaPublica />,
    children: [{ path: '/login', element: <LoginPage /> }],
  },
  {
    element: <RotaProtegida />,
    children: [
      {
        element: <AppLayout />,
        children: [
          {
            index: true,
            element: (
              <Suspense fallback={<Carregando />}>
                <DashboardPage />
              </Suspense>
            ),
          },
          { path: 'solicitacoes', element: <ListaSolicitacoesPage /> },
          { path: 'solicitacoes/nova', element: <FormularioSolicitacaoPage /> },
          { path: 'solicitacoes/:id', element: <DetalheSolicitacaoPage /> },
          { path: 'solicitacoes/:id/editar', element: <FormularioSolicitacaoPage /> },
          { path: 'dashboard', element: <Navigate to="/" replace /> },
          { path: '*', element: <NaoEncontrada /> },
        ],
      },
    ],
  },
]);

export function App() {
  return <RouterProvider router={router} />;
}
