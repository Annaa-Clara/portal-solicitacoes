import { ArrowDown, ArrowUp, ChevronRight, ChevronsUpDown, FileSearch, Inbox, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button, LinkBotao } from '@/components/ui/button';
import { CabecalhoPagina, EstadoVazio, Skeleton } from '@/components/ui/feedback';
import { Paginacao } from '@/components/ui/paginacao';
import { StatusBadge } from '@/components/ui/status-badge';
import { useAuth } from '@/features/auth/use-auth';
import { ApiError } from '@/lib/api';
import { formatarData, formatarDataHora } from '@/lib/formatacao';
import { cn } from '@/lib/utils';
import type { FiltroSolicitacoes } from '@/types/api';
import { useCategorias, useSolicitacoes } from './api';
import { Filtros } from './components/filtros';
import { useFiltrosUrl } from './use-filtros-url';

type Ordenavel = NonNullable<FiltroSolicitacoes['ordenarPor']>;

function CabecalhoOrdenavel({
  campo,
  rotulo,
  filtro,
  aoOrdenar,
  className,
}: {
  campo: Ordenavel;
  rotulo: string;
  filtro: FiltroSolicitacoes;
  aoOrdenar: (campo: Ordenavel) => void;
  className?: string;
}) {
  const ativo = filtro.ordenarPor === campo;
  const Icone = !ativo ? ChevronsUpDown : filtro.direcao === 'asc' ? ArrowUp : ArrowDown;
  return (
    <th
      scope="col"
      className={cn('px-4 py-3 font-medium', className)}
      aria-sort={ativo ? (filtro.direcao === 'asc' ? 'ascending' : 'descending') : 'none'}
    >
      <button
        type="button"
        onClick={() => aoOrdenar(campo)}
        className={cn(
          'inline-flex items-center gap-1 rounded transition hover:text-texto',
          ativo && 'text-texto',
        )}
      >
        {rotulo}
        <Icone className="h-3.5 w-3.5" aria-hidden />
      </button>
    </th>
  );
}

export function ListaSolicitacoesPage() {
  const { usuario } = useAuth();
  const navegar = useNavigate();
  const { filtro, atualizar, limpar, quantidadeAtivos } = useFiltrosUrl();
  const categorias = useCategorias();
  const { data, isPending, isError, error, isPlaceholderData, refetch } = useSolicitacoes(filtro);
  const atendente = usuario?.perfil === 'ATENDENTE';

  const ordenar = (campo: Ordenavel) => {
    const direcao =
      filtro.ordenarPor === campo
        ? filtro.direcao === 'asc'
          ? 'desc'
          : 'asc'
        : campo === 'titulo'
          ? 'asc'
          : 'desc';
    atualizar({ ordenarPor: campo, direcao });
  };

  const abrir = (id: number) => navegar(`/solicitacoes/${id}`);

  return (
    <div className="animate-entrar">
      <CabecalhoPagina
        titulo="Solicitações"
        descricao={
          atendente
            ? 'Todas as solicitações registradas pelos colaboradores.'
            : 'Solicitações que você registrou.'
        }
        acoes={
          <LinkBotao to="/solicitacoes/nova">
            <Plus className="h-4 w-4" aria-hidden /> Nova solicitação
          </LinkBotao>
        }
      />

      <div className="cartao overflow-hidden">
        <Filtros
          filtro={filtro}
          categorias={categorias.data ?? []}
          quantidadeAtivos={quantidadeAtivos}
          aoMudar={atualizar}
          aoLimpar={limpar}
        />

        {isError ? (
          <EstadoVazio
            icone={Inbox}
            titulo={
              error instanceof ApiError && error.status === 400
                ? 'Filtro inválido'
                : 'Não foi possível carregar'
            }
            descricao={error instanceof ApiError ? (error.erros[0]?.mensagem ?? error.message) : undefined}
            acao={
              error instanceof ApiError && error.status === 400 ? (
                <Button variante="secundario" onClick={limpar}>
                  Limpar filtros
                </Button>
              ) : (
                <Button onClick={() => refetch()}>Tentar novamente</Button>
              )
            }
          />
        ) : isPending ? (
          <div className="space-y-3 p-5" aria-busy="true" aria-label="Carregando solicitações">
            {Array.from({ length: 6 }, (_, i) => (
              <Skeleton key={i} className="h-11" />
            ))}
          </div>
        ) : data.itens.length === 0 ? (
          quantidadeAtivos > 0 ? (
            <EstadoVazio
              icone={FileSearch}
              titulo="Nenhum resultado para os filtros"
              descricao="Ajuste os critérios de busca ou limpe os filtros para ver todas as solicitações."
              acao={
                <Button variante="secundario" onClick={limpar}>
                  Limpar filtros
                </Button>
              }
            />
          ) : (
            <EstadoVazio
              icone={Inbox}
              titulo="Nenhuma solicitação por aqui"
              descricao="Quando você registrar uma demanda, ela aparecerá nesta lista."
              acao={
                <LinkBotao to="/solicitacoes/nova">
                  <Plus className="h-4 w-4" /> Registrar a primeira
                </LinkBotao>
              }
            />
          )
        ) : (
          <div className={cn('transition-opacity', isPlaceholderData && 'opacity-60')}>
            {/* Tabela (telas médias e grandes) */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-left text-sm">
                <caption className="sr-only">Lista de solicitações</caption>
                <thead className="border-b border-borda bg-elevada/50 text-xs text-suave">
                  <tr>
                    <CabecalhoOrdenavel
                      campo="id"
                      rotulo="Código"
                      filtro={filtro}
                      aoOrdenar={ordenar}
                      className="pl-5"
                    />
                    <CabecalhoOrdenavel campo="titulo" rotulo="Título" filtro={filtro} aoOrdenar={ordenar} />
                    <th scope="col" className="px-4 py-3 font-medium">
                      Categoria
                    </th>
                    <th scope="col" className="px-4 py-3 font-medium">
                      Solicitante
                    </th>
                    <CabecalhoOrdenavel
                      campo="criadoEm"
                      rotulo="Abertura"
                      filtro={filtro}
                      aoOrdenar={ordenar}
                    />
                    <CabecalhoOrdenavel campo="status" rotulo="Status" filtro={filtro} aoOrdenar={ordenar} />
                    <th scope="col" className="w-10">
                      <span className="sr-only">Abrir</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-borda">
                  {data.itens.map((s) => (
                    <tr
                      key={s.id}
                      onClick={() => abrir(s.id)}
                      className="group cursor-pointer transition hover:bg-elevada/60"
                    >
                      <td className="whitespace-nowrap py-3.5 pl-5 pr-4 font-mono text-xs text-suave">
                        {s.codigo}
                      </td>
                      <td className="max-w-xs px-4 py-3.5">
                        {/* O link garante navegação por teclado e leitores de tela */}
                        <a
                          href={`/solicitacoes/${s.id}`}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            abrir(s.id);
                          }}
                          className="line-clamp-1 font-medium hover:text-marca"
                        >
                          {s.titulo}
                        </a>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3.5 text-suave">{s.categoria.nome}</td>
                      <td className="whitespace-nowrap px-4 py-3.5 text-suave">{s.solicitante.nome}</td>
                      <td
                        className="whitespace-nowrap px-4 py-3.5 text-suave"
                        title={formatarDataHora(s.criadoEm)}
                      >
                        {formatarData(s.criadoEm)}
                      </td>
                      <td className="px-4 py-3.5">
                        <StatusBadge status={s.status} />
                      </td>
                      <td className="pr-4 text-suave">
                        <ChevronRight
                          className="h-4 w-4 opacity-0 transition group-hover:opacity-100"
                          aria-hidden
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Cartões (celular) */}
            <ul className="divide-y divide-borda md:hidden">
              {data.itens.map((s) => (
                <li key={s.id}>
                  <a
                    href={`/solicitacoes/${s.id}`}
                    onClick={(e) => {
                      e.preventDefault();
                      abrir(s.id);
                    }}
                    className="block px-4 py-4 transition active:bg-elevada"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <p className="font-medium leading-snug">{s.titulo}</p>
                      <StatusBadge status={s.status} className="mt-0.5" />
                    </div>
                    <p className="mt-1.5 text-xs text-suave">
                      <span className="font-mono">{s.codigo}</span> · {s.categoria.nome} ·{' '}
                      {formatarData(s.criadoEm)}
                    </p>
                    {atendente && <p className="mt-0.5 text-xs text-suave">{s.solicitante.nome}</p>}
                  </a>
                </li>
              ))}
            </ul>

            <Paginacao
              pagina={data.pagina}
              totalPaginas={data.totalPaginas}
              total={data.total}
              tamanho={data.tamanho}
              aoMudar={(pagina) => atualizar({ pagina })}
            />
          </div>
        )}
      </div>
    </div>
  );
}
