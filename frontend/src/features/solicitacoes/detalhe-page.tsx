import { ArrowLeft, CheckCircle2, Clock3, Copy, FileQuestion, Pencil, RotateCcw, Trash2 } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Button, LinkBotao } from '@/components/ui/button';
import { Dialogo } from '@/components/ui/dialogo';
import { EstadoVazio, Skeleton } from '@/components/ui/feedback';
import { StatusBadge } from '@/components/ui/status-badge';
import { ApiError } from '@/lib/api';
import { iconeCategoria } from '@/lib/categorias';
import { formatarDataHora, formatarDuracaoHoras, formatarRelativo } from '@/lib/formatacao';
import { STATUS } from '@/lib/status';
import type { Status } from '@/types/api';
import { useExcluirSolicitacao, useSolicitacao } from './api';
import { DialogoAlterarStatus } from './components/dialogo-alterar-status';
import { LinhaDoTempo, ProgressoStatus } from './components/linha-do-tempo';

const ICONE_ACAO: Record<Status, typeof Clock3> = {
  ABERTO: RotateCcw,
  EM_ATENDIMENTO: Clock3,
  CONCLUIDO: CheckCircle2,
};

function Item({ rotulo, children }: { rotulo: string; children: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-3 text-sm">
      <dt className="text-suave">{rotulo}</dt>
      <dd className="text-right font-medium">{children}</dd>
    </div>
  );
}

export function DetalheSolicitacaoPage() {
  const id = Number(useParams().id);
  const navegar = useNavigate();
  const { data: s, isPending, isError, error } = useSolicitacao(id);
  const excluir = useExcluirSolicitacao();
  const [destino, setDestino] = useState<Status | null>(null);
  const [confirmarExclusao, setConfirmarExclusao] = useState(false);

  const voltar = (
    <Link
      to="/solicitacoes"
      className="mb-4 inline-flex items-center gap-1 text-sm text-suave hover:text-texto"
    >
      <ArrowLeft className="h-4 w-4" aria-hidden /> Solicitações
    </Link>
  );

  if (isError || !Number.isInteger(id)) {
    return (
      <div className="animate-entrar">
        {voltar}
        <div className="cartao">
          <EstadoVazio
            icone={FileQuestion}
            titulo="Solicitação não encontrada"
            descricao={
              error instanceof ApiError && error.status !== 404
                ? error.message
                : 'Ela pode ter sido excluída ou você não tem acesso a ela.'
            }
            acao={
              <LinkBotao to="/solicitacoes" variante="secundario">
                Ver todas as solicitações
              </LinkBotao>
            }
          />
        </div>
      </div>
    );
  }

  if (isPending) {
    return (
      <div className="space-y-4" aria-busy="true">
        {voltar}
        <Skeleton className="h-8 w-2/3" />
        <div className="grid gap-6 lg:grid-cols-3">
          <Skeleton className="h-72 rounded-2xl lg:col-span-2" />
          <Skeleton className="h-72 rounded-2xl" />
        </div>
      </div>
    );
  }

  const IconeCategoria = iconeCategoria(s.categoria.nome);
  const { podeEditar, podeExcluir, transicoesPermitidas } = s.permissoes;
  const duracao = s.concluidoEm
    ? (new Date(s.concluidoEm).getTime() - new Date(s.criadoEm).getTime()) / 3_600_000
    : null;

  const aoExcluir = async () => {
    try {
      await excluir.mutateAsync(s.id);
      toast.success(`Solicitação ${s.codigo} excluída.`);
      navegar('/solicitacoes', { replace: true });
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Não foi possível excluir.');
      setConfirmarExclusao(false);
    }
  };

  const copiarCodigo = async () => {
    try {
      await navigator.clipboard.writeText(s.codigo);
      toast.success('Código copiado.');
    } catch {
      /* navegador sem permissão de área de transferência */
    }
  };

  return (
    <div className="animate-entrar">
      {voltar}

      <header className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={copiarCodigo}
              className="inline-flex items-center gap-1.5 rounded-lg bg-elevada px-2 py-0.5 font-mono text-xs text-suave transition hover:text-texto"
              title="Copiar código"
            >
              {s.codigo} <Copy className="h-3 w-3" aria-hidden />
            </button>
            <StatusBadge status={s.status} />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-[1.7rem]">{s.titulo}</h1>
          <p className="mt-1 text-sm text-suave">
            Aberta por {s.solicitante.nome} {formatarRelativo(s.criadoEm)}
          </p>
        </div>

        {(podeEditar || podeExcluir || transicoesPermitidas.length > 0) && (
          <div className="flex shrink-0 flex-wrap gap-2">
            {transicoesPermitidas.map((t) => {
              const Icone = ICONE_ACAO[t];
              return (
                <Button
                  key={t}
                  variante={t === 'ABERTO' ? 'secundario' : 'primario'}
                  onClick={() => setDestino(t)}
                >
                  <Icone className="h-4 w-4" aria-hidden /> {STATUS[t].acao}
                </Button>
              );
            })}
            {podeEditar && (
              <LinkBotao to={`/solicitacoes/${s.id}/editar`} variante="secundario">
                <Pencil className="h-4 w-4" aria-hidden /> Editar
              </LinkBotao>
            )}
            {podeExcluir && (
              <Button
                variante="secundario"
                className="text-perigo hover:bg-perigo/10"
                onClick={() => setConfirmarExclusao(true)}
              >
                <Trash2 className="h-4 w-4" aria-hidden /> Excluir
              </Button>
            )}
          </div>
        )}
      </header>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <section className="cartao p-5 sm:p-6" aria-labelledby="t-descricao">
            <h2 id="t-descricao" className="mb-3 text-sm font-semibold uppercase tracking-wider text-suave">
              Descrição
            </h2>
            <p className="whitespace-pre-line break-words leading-relaxed">{s.descricao}</p>
          </section>

          <section className="cartao p-5 sm:p-6" aria-labelledby="t-historico">
            <h2 id="t-historico" className="mb-5 text-sm font-semibold uppercase tracking-wider text-suave">
              Histórico
            </h2>
            <LinhaDoTempo historico={s.historico} />
          </section>
        </div>

        <aside className="space-y-6">
          <section className="cartao p-5 sm:p-6" aria-labelledby="t-andamento">
            <h2 id="t-andamento" className="mb-5 text-sm font-semibold uppercase tracking-wider text-suave">
              Andamento
            </h2>
            <ProgressoStatus status={s.status} />
            {!podeEditar && s.status === 'ABERTO' && s.permissoes.transicoesPermitidas.length === 0 && (
              <p className="mt-4 text-xs text-suave">Aguardando um atendente iniciar o atendimento.</p>
            )}
          </section>

          <section className="cartao px-5 py-2 sm:px-6" aria-label="Detalhes">
            <dl className="divide-y divide-borda">
              <Item rotulo="Categoria">
                <span className="inline-flex items-center gap-1.5">
                  <IconeCategoria className="h-4 w-4 text-suave" aria-hidden /> {s.categoria.nome}
                </span>
              </Item>
              <Item rotulo="Solicitante">{s.solicitante.nome}</Item>
              <Item rotulo="Abertura">{formatarDataHora(s.criadoEm)}</Item>
              <Item rotulo="Última atualização">{formatarDataHora(s.atualizadoEm)}</Item>
              {s.concluidoEm && (
                <>
                  <Item rotulo="Conclusão">{formatarDataHora(s.concluidoEm)}</Item>
                  <Item rotulo="Tempo total">
                    {formatarDuracaoHoras(Math.round((duracao ?? 0) * 10) / 10)}
                  </Item>
                </>
              )}
            </dl>
          </section>
        </aside>
      </div>

      <DialogoAlterarStatus solicitacao={s} destino={destino} aoFechar={() => setDestino(null)} />

      <Dialogo
        aberto={confirmarExclusao}
        aoFechar={() => setConfirmarExclusao(false)}
        titulo="Excluir solicitação?"
        descricao={
          <>
            A solicitação <strong>{s.codigo}</strong> e seu histórico serão removidos permanentemente.
          </>
        }
        rodape={
          <>
            <Button variante="secundario" onClick={() => setConfirmarExclusao(false)}>
              Cancelar
            </Button>
            <Button variante="perigo" onClick={aoExcluir} carregando={excluir.isPending}>
              Excluir
            </Button>
          </>
        }
      />
    </div>
  );
}
