import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowRight, Eye, EyeOff, History, LayoutDashboard, ShieldCheck, UserRound } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { z } from 'zod';
import { Logo } from '@/components/layout/logo';
import { Button } from '@/components/ui/button';
import { Campo, Input } from '@/components/ui/campos';
import { ApiError } from '@/lib/api';
import { useAuth } from './use-auth';

const esquema = z.object({
  usuario: z.string().trim().min(1, 'Informe o usuário.'),
  senha: z.string().min(1, 'Informe a senha.'),
});
type Dados = z.infer<typeof esquema>;

const CONTAS_DEMO = [
  { usuario: 'ana.souza', nome: 'Ana Souza', papel: 'Solicitante' },
  { usuario: 'carlos.lima', nome: 'Carlos Lima', papel: 'Solicitante' },
  { usuario: 'joana.pereira', nome: 'Joana Pereira', papel: 'Atendente' },
];

const DESTAQUES = [
  { icone: LayoutDashboard, texto: 'Indicadores em tempo real por status e categoria' },
  { icone: History, texto: 'Linha do tempo completa de cada solicitação' },
  { icone: ShieldCheck, texto: 'Sessão segura com revogação no logout' },
];

export function LoginPage() {
  const { entrar } = useAuth();
  const navegar = useNavigate();
  const local = useLocation();
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [erroGeral, setErroGeral] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    setFocus,
    formState: { errors, isSubmitting },
  } = useForm<Dados>({ resolver: zodResolver(esquema), defaultValues: { usuario: '', senha: '' } });

  const aoEnviar = handleSubmit(async ({ usuario, senha }) => {
    setErroGeral(null);
    try {
      const u = await entrar(usuario, senha);
      toast.success(`Bem-vindo(a), ${u.nome.split(' ')[0]}!`);
      const destino = (local.state as { de?: string } | null)?.de ?? '/';
      navegar(destino, { replace: true });
    } catch (erro) {
      setErroGeral(erro instanceof ApiError ? erro.message : 'Não foi possível entrar.');
      setFocus('senha');
    }
  });

  const preencher = (usuario: string) => {
    setValue('usuario', usuario, { shouldValidate: true });
    setValue('senha', 'Demo@123', { shouldValidate: true });
    setErroGeral(null);
  };

  return (
    <div className="grid min-h-dvh lg:grid-cols-[1.05fr_1fr]">
      {/* Painel da marca */}
      <aside className="relative hidden overflow-hidden bg-gradient-to-br from-blue-700 via-blue-800 to-indigo-950 p-12 text-white lg:flex lg:flex-col">
        <div
          className="absolute inset-0 opacity-[0.12]"
          style={{
            backgroundImage:
              'linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)',
            backgroundSize: '44px 44px',
            maskImage: 'radial-gradient(ellipse at 30% 40%, black 20%, transparent 75%)',
          }}
          aria-hidden
        />
        <div
          className="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-sky-400/25 blur-3xl"
          aria-hidden
        />
        <div
          className="absolute -bottom-32 left-10 h-80 w-80 rounded-full bg-indigo-400/20 blur-3xl"
          aria-hidden
        />

        <Logo claro />
        <div className="relative my-auto max-w-lg">
          <h2 className="text-4xl font-semibold leading-tight tracking-tight">
            Cada demanda interna, do pedido à conclusão.
          </h2>
          <p className="mt-4 text-lg text-blue-100/85">
            Registre solicitações para TI, RH, Compras, Financeiro e Infraestrutura e acompanhe cada etapa sem
            precisar perguntar a ninguém.
          </p>
          <ul className="mt-10 space-y-4">
            {DESTAQUES.map(({ icone: Icone, texto }) => (
              <li key={texto} className="flex items-center gap-3 text-blue-50">
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-white/10 ring-1 ring-white/15">
                  <Icone className="h-[18px] w-[18px]" aria-hidden />
                </span>
                {texto}
              </li>
            ))}
          </ul>
        </div>
        <p className="relative text-sm text-blue-200/70">Portal de Solicitações Internas · v1.0</p>
      </aside>

      {/* Formulário */}
      <main className="flex items-center justify-center px-5 py-10 sm:px-8">
        <div className="w-full max-w-sm animate-entrar">
          <div className="mb-8 lg:hidden">
            <Logo />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">Entrar no portal</h1>
          <p className="mt-1.5 text-sm text-suave">Use suas credenciais corporativas para continuar.</p>

          <form onSubmit={aoEnviar} className="mt-8 space-y-5" noValidate>
            {erroGeral && (
              <div
                role="alert"
                className="rounded-xl border border-perigo/30 bg-perigo/10 px-3.5 py-2.5 text-sm text-perigo"
              >
                {erroGeral}
              </div>
            )}

            <Campo rotulo="Usuário" erro={errors.usuario?.message}>
              {(p) => (
                <Input
                  {...p}
                  {...register('usuario')}
                  autoComplete="username"
                  autoFocus
                  placeholder="nome.sobrenome"
                />
              )}
            </Campo>

            <Campo rotulo="Senha" erro={errors.senha?.message}>
              {(p) => (
                <div className="relative">
                  <Input
                    {...p}
                    {...register('senha')}
                    type={mostrarSenha ? 'text' : 'password'}
                    autoComplete="current-password"
                    className="pr-10"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setMostrarSenha((v) => !v)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-suave transition hover:bg-elevada hover:text-texto"
                    aria-label={mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'}
                  >
                    {mostrarSenha ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              )}
            </Campo>

            <Button type="submit" tamanho="lg" className="w-full" carregando={isSubmitting}>
              Entrar
              {!isSubmitting && <ArrowRight className="h-4 w-4" aria-hidden />}
            </Button>
          </form>

          <section className="mt-10 rounded-2xl border border-dashed border-borda p-4" aria-labelledby="demo">
            <h2 id="demo" className="text-xs font-semibold uppercase tracking-wider text-suave">
              Contas de demonstração · senha Demo@123
            </h2>
            <div className="mt-3 grid gap-2">
              {CONTAS_DEMO.map((c) => (
                <button
                  key={c.usuario}
                  type="button"
                  onClick={() => preencher(c.usuario)}
                  className="flex items-center gap-3 rounded-xl px-2.5 py-2 text-left transition hover:bg-elevada"
                >
                  <span className="grid h-8 w-8 place-items-center rounded-full bg-marca-fundo text-marca">
                    <UserRound className="h-4 w-4" aria-hidden />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium">{c.nome}</span>
                    <span className="block text-xs text-suave">{c.usuario}</span>
                  </span>
                  <span className="rounded-full bg-elevada px-2 py-0.5 text-[11px] font-medium text-suave">
                    {c.papel}
                  </span>
                </button>
              ))}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
