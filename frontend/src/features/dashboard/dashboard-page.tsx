import {
  ArrowRight,
  CheckCircle2,
  CircleDot,
  Clock3,
  Inbox,
  Layers,
  Plus,
  RefreshCw,
  Timer,
  type LucideIcon,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button, LinkBotao } from '@/components/ui/button';
import { CabecalhoPagina, EstadoVazio, Skeleton } from '@/components/ui/feedback';
import { StatusBadge } from '@/components/ui/status-badge';
import { useAuth } from '@/features/auth/use-auth';
import { useDashboard } from '@/features/solicitacoes/api';
import { formatarDuracaoHoras, formatarRelativo } from '@/lib/formatacao';
import { cn } from '@/lib/utils';
import { DistribuicaoCategorias } from './components/distribuicao-categorias';
import { GraficoEvolucao } from './components/grafico-evolucao';

interface IndicadorProps {
  rotulo: string;
  valor: number;
  total: number;
  icone: LucideIcon;
  destaque: string;
  para: string;
}

function Indicador({ rotulo, valor, total, icone: Icone, destaque, para }: IndicadorProps) {
  const percentual = total > 0 ? Math.round((valor / total) * 100) : 0;
  return (
    <Link
      to={para}
      className="cartao group relative overflow-hidden p-5 transition hover:-translate-y-0.5 hover:shadow-flutuante"
    >
      <div className="flex items-start justify-between">
        <p className="text-sm font-medium text-suave">{rotulo}</p>
        <span className={cn('grid h-9 w-9 place-items-center rounded-xl', destaque)}>
          <Icone className="h-[18px] w-[18px]" aria-hidden />
        </span>
      </div>
      <p className="mt-3 text-3xl font-semibold tabular-nums tracking-tight">{valor}</p>
      <p className="mt-1 flex items-center gap-1 text-xs text-suave">
        {rotulo === 'Total' ? 'solicitações registradas' : `${percentual}% do total`}
        <ArrowRight
          className="ml-auto h-3.5 w-3.5 opacity-0 transition group-hover:opacity-100"
          aria-hidden
        />
      </p>
    </Link>
  );
}

function saudacao() {
  const h = new Date().getHours();
  return h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite';
}

export function DashboardPage() {
  const { usuario } = useAuth();
  const { data, isPending, isError, refetch, isFetching } = useDashboard();
  const atendente = usuario?.perfil === 'ATENDENTE';

  return (
    <div className="animate-entrar">
      <CabecalhoPagina
        titulo={`${saudacao()}, ${usuario?.nome.split(' ')[0]}`}
        descricao={
          atendente
            ? 'Visão geral de todas as solicitações da empresa.'
            : 'Acompanhe o andamento das suas solicitações.'
        }
        acoes={
          <>
            <Button
              variante="secundario"
              onClick={() => refetch()}
              carregando={isFetching && !isPending}
              aria-label="Atualizar"
            >
              {!(isFetching && !isPending) && <RefreshCw className="h-4 w-4" aria-hidden />}
              <span className="hidden sm:inline">Atualizar</span>
            </Button>
            <LinkBotao to="/solicitacoes/nova">
              <Plus className="h-4 w-4" aria-hidden /> Nova solicitação
            </LinkBotao>
          </>
        }
      />

      {isError ? (
        <div className="cartao">
          <EstadoVazio
            icone={Inbox}
            titulo="Não foi possível carregar os indicadores"
            descricao="Verifique sua conexão e tente novamente."
            acao={<Button onClick={() => refetch()}>Tentar novamente</Button>}
          />
        </div>
      ) : (
        <div className="space-y-6">
          <section aria-label="Indicadores" className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
            {isPending || !data ? (
              Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-[132px] rounded-2xl" />)
            ) : (
              <>
                <Indicador
                  rotulo="Total"
                  valor={data.indicadores.total}
                  total={data.indicadores.total}
                  icone={Layers}
                  destaque="bg-marca-fundo text-marca"
                  para="/solicitacoes"
                />
                <Indicador
                  rotulo="Abertas"
                  valor={data.indicadores.abertas}
                  total={data.indicadores.total}
                  icone={CircleDot}
                  destaque="bg-amber-100 text-amber-700 dark:bg-amber-400/10 dark:text-amber-300"
                  para="/solicitacoes?status=ABERTO"
                />
                <Indicador
                  rotulo="Em atendimento"
                  valor={data.indicadores.emAtendimento}
                  total={data.indicadores.total}
                  icone={Clock3}
                  destaque="bg-sky-100 text-sky-700 dark:bg-sky-400/10 dark:text-sky-300"
                  para="/solicitacoes?status=EM_ATENDIMENTO"
                />
                <Indicador
                  rotulo="Concluídas"
                  valor={data.indicadores.concluidas}
                  total={data.indicadores.total}
                  icone={CheckCircle2}
                  destaque="bg-emerald-100 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300"
                  para="/solicitacoes?status=CONCLUIDO"
                />
              </>
            )}
          </section>

          <div className="grid gap-6 lg:grid-cols-3">
            <section className="cartao p-5 sm:p-6 lg:col-span-2" aria-labelledby="t-evolucao">
              <div className="mb-1 flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 id="t-evolucao" className="font-semibold">
                    Movimento dos últimos 14 dias
                  </h2>
                  <p className="text-sm text-suave">Solicitações registradas e concluídas por dia</p>
                </div>
                {data && (
                  <div
                    className="flex items-center gap-2 rounded-xl bg-elevada px-3 py-1.5 text-xs"
                    title="Tempo médio entre a abertura e a conclusão"
                  >
                    <Timer className="h-4 w-4 text-marca" aria-hidden />
                    <span className="text-suave">Tempo médio de conclusão</span>
                    <span className="font-semibold tabular-nums">
                      {formatarDuracaoHoras(data.indicadores.tempoMedioConclusaoHoras)}
                    </span>
                  </div>
                )}
              </div>
              <div className="mt-4">
                {isPending || !data ? (
                  <Skeleton className="h-64" />
                ) : (
                  <GraficoEvolucao dados={data.evolucao} />
                )}
              </div>
            </section>

            <section className="cartao p-5 sm:p-6" aria-labelledby="t-categorias">
              <h2 id="t-categorias" className="font-semibold">
                Por categoria
              </h2>
              <p className="mb-5 text-sm text-suave">Distribuição por status</p>
              {isPending || !data ? (
                <div className="space-y-4">
                  {Array.from({ length: 5 }, (_, i) => (
                    <Skeleton key={i} className="h-7" />
                  ))}
                </div>
              ) : (
                <DistribuicaoCategorias dados={data.porCategoria} />
              )}
            </section>
          </div>

          <section className="cartao overflow-hidden" aria-labelledby="t-recentes">
            <div className="flex items-center justify-between border-b border-borda px-5 py-4 sm:px-6">
              <div>
                <h2 id="t-recentes" className="font-semibold">
                  Atividade recente
                </h2>
                <p className="text-sm text-suave">Últimas solicitações registradas</p>
              </div>
              <Link
                to="/solicitacoes"
                className="flex items-center gap-1 text-sm font-medium text-marca hover:underline"
              >
                Ver todas <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </div>
            {isPending || !data ? (
              <div className="space-y-3 p-5">
                {Array.from({ length: 4 }, (_, i) => (
                  <Skeleton key={i} className="h-10" />
                ))}
              </div>
            ) : data.recentes.length === 0 ? (
              <EstadoVazio
                icone={Inbox}
                titulo="Nenhuma solicitação ainda"
                descricao="Registre sua primeira demanda e acompanhe o andamento por aqui."
                acao={
                  <LinkBotao to="/solicitacoes/nova">
                    <Plus className="h-4 w-4" /> Nova solicitação
                  </LinkBotao>
                }
              />
            ) : (
              <ul className="divide-y divide-borda">
                {data.recentes.map((s) => (
                  <li key={s.id}>
                    <Link
                      to={`/solicitacoes/${s.id}`}
                      className="flex items-center gap-4 px-5 py-3.5 transition hover:bg-elevada/60 sm:px-6"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{s.titulo}</p>
                        <p className="mt-0.5 truncate text-xs text-suave">
                          <span className="font-mono">{s.codigo}</span> · {s.categoria.nome}
                          {atendente && <> · {s.solicitante.nome}</>} · {formatarRelativo(s.criadoEm)}
                        </p>
                      </div>
                      <StatusBadge status={s.status} />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
