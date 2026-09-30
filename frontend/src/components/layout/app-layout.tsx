import { ClipboardList, LayoutDashboard, LogOut, Menu, Moon, Plus, Sun, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/features/auth/use-auth';
import { useTema } from '@/hooks/use-tema';
import { cn } from '@/lib/utils';
import { Button } from '../ui/button';
import { Logo } from './logo';

const NAVEGACAO = [
  { para: '/', rotulo: 'Dashboard', icone: LayoutDashboard, fim: true },
  { para: '/solicitacoes', rotulo: 'Solicitações', icone: ClipboardList, fim: false },
];

function iniciais(nome: string) {
  const partes = nome.trim().split(/\s+/);
  return (partes[0][0] + (partes.length > 1 ? partes[partes.length - 1][0] : '')).toUpperCase();
}

function ConteudoLateral({ aoNavegar }: { aoNavegar?: () => void }) {
  const { usuario, sair, saindo } = useAuth();
  const { tema, alternar } = useTema();
  if (!usuario) return null;

  return (
    <div className="flex h-full flex-col">
      <div className="px-5 pb-6 pt-5">
        <Logo />
      </div>

      <div className="px-3">
        <NavLink
          to="/solicitacoes/nova"
          onClick={aoNavegar}
          className="mb-5 flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-marca text-sm font-medium text-white shadow-sm transition hover:bg-marca-forte dark:text-slate-950"
        >
          <Plus className="h-4 w-4" aria-hidden /> Nova solicitação
        </NavLink>

        <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-suave/80">Menu</p>
        <nav className="space-y-1" aria-label="Principal">
          {NAVEGACAO.map(({ para, rotulo, icone: Icone, fim }) => (
            <NavLink
              key={para}
              to={para}
              end={fim}
              onClick={aoNavegar}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition',
                  isActive ? 'bg-marca-fundo text-marca' : 'text-suave hover:bg-elevada hover:text-texto',
                )
              }
            >
              <Icone className="h-[18px] w-[18px]" aria-hidden />
              {rotulo}
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="mt-auto border-t border-borda p-3">
        <div className="flex items-center gap-3 rounded-xl p-2">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-xs font-semibold text-white">
            {iniciais(usuario.nome)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{usuario.nome}</p>
            <p className="truncate text-xs text-suave">
              {usuario.perfil === 'ATENDENTE' ? 'Atendente' : 'Solicitante'} · {usuario.usuario}
            </p>
          </div>
        </div>
        <div className="mt-1 grid grid-cols-2 gap-1.5">
          <Button variante="fantasma" tamanho="sm" onClick={alternar} aria-label="Alternar tema">
            {tema === 'escuro' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            {tema === 'escuro' ? 'Claro' : 'Escuro'}
          </Button>
          <Button variante="fantasma" tamanho="sm" onClick={sair} carregando={saindo}>
            {!saindo && <LogOut className="h-4 w-4" aria-hidden />} Sair
          </Button>
        </div>
      </div>
    </div>
  );
}

export function AppLayout() {
  const [menuAberto, setMenuAberto] = useState(false);
  const { pathname } = useLocation();

  useEffect(() => {
    setMenuAberto(false);
    window.scrollTo({ top: 0 });
  }, [pathname]);

  return (
    <div className="min-h-dvh">
      <a
        href="#conteudo"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-superficie focus:px-3 focus:py-2"
      >
        Pular para o conteúdo
      </a>

      {/* Lateral fixa (desktop) */}
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-borda bg-superficie lg:block">
        <ConteudoLateral />
      </aside>

      {/* Barra superior (mobile) */}
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-borda bg-superficie/85 px-4 backdrop-blur lg:hidden">
        <Logo compacto />
        <span className="text-sm font-semibold">Portal de Solicitações</span>
        <Button
          variante="fantasma"
          tamanho="icone"
          onClick={() => setMenuAberto(true)}
          aria-label="Abrir menu"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </header>

      {/* Gaveta (mobile) */}
      {menuAberto && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 animate-fade-in bg-slate-950/50"
            onClick={() => setMenuAberto(false)}
            aria-hidden
          />
          <aside className="absolute inset-y-0 left-0 w-72 max-w-[85vw] animate-entrar border-r border-borda bg-superficie shadow-flutuante">
            <Button
              variante="fantasma"
              tamanho="icone"
              className="absolute right-3 top-4"
              onClick={() => setMenuAberto(false)}
              aria-label="Fechar menu"
            >
              <X className="h-5 w-5" />
            </Button>
            <ConteudoLateral aoNavegar={() => setMenuAberto(false)} />
          </aside>
        </div>
      )}

      <main id="conteudo" className="lg:pl-64">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8 lg:px-10">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
