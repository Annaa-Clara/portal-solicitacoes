import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, Lock } from 'lucide-react';
import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { z } from 'zod';
import { Button, LinkBotao } from '@/components/ui/button';
import { Campo, Input, Textarea } from '@/components/ui/campos';
import { CabecalhoPagina, EstadoVazio, Skeleton } from '@/components/ui/feedback';
import { ApiError } from '@/lib/api';
import { iconeCategoria } from '@/lib/categorias';
import { cn } from '@/lib/utils';
import type { Categoria } from '@/types/api';
import { useAtualizarSolicitacao, useCategorias, useCriarSolicitacao, useSolicitacao } from './api';

// Mesmas regras do backend: o usuário recebe o erro antes de enviar,
// e o backend continua sendo a validação definitiva.
const esquema = z.object({
  titulo: z
    .string()
    .trim()
    .min(5, 'Título deve ter entre 5 e 120 caracteres.')
    .max(120, 'Título deve ter entre 5 e 120 caracteres.'),
  descricao: z
    .string()
    .trim()
    .min(10, 'Descrição deve ter entre 10 e 2000 caracteres.')
    .max(2000, 'Descrição deve ter entre 10 e 2000 caracteres.'),
  categoriaId: z.number({ message: 'Selecione uma categoria.' }).int().positive('Selecione uma categoria.'),
});
type Dados = z.infer<typeof esquema>;
const CAMPOS = ['titulo', 'descricao', 'categoriaId'] as const;

function Contador({ atual, maximo }: { atual: number; maximo: number }) {
  return (
    <span className={cn('tabular-nums', atual > maximo ? 'text-perigo' : 'text-suave')}>
      {atual}/{maximo}
    </span>
  );
}

function SeletorCategoria({
  categorias,
  valor,
  aoMudar,
  erro,
}: {
  categorias: Categoria[];
  valor?: number;
  aoMudar: (id: number) => void;
  erro?: string;
}) {
  return (
    <fieldset>
      <legend className="mb-1.5 block text-sm font-medium">
        Categoria
        <span className="ml-0.5 text-perigo" aria-hidden>
          *
        </span>
      </legend>
      <div
        className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5"
        role="radiogroup"
        aria-invalid={Boolean(erro)}
      >
        {categorias.map((c) => {
          const Icone = iconeCategoria(c.nome);
          const selecionada = valor === c.id;
          return (
            <label
              key={c.id}
              className={cn(
                'relative flex cursor-pointer flex-col gap-2 rounded-xl border p-3 transition focus-within:ring-2 focus-within:ring-marca/40',
                selecionada
                  ? 'border-marca bg-marca-fundo ring-1 ring-marca'
                  : 'border-borda bg-superficie hover:border-suave/40 hover:bg-elevada/50',
              )}
              title={c.descricao ?? undefined}
            >
              <input
                type="radio"
                name="categoriaId"
                value={c.id}
                checked={selecionada}
                onChange={() => aoMudar(c.id)}
                className="sr-only"
              />
              <Icone className={cn('h-5 w-5', selecionada ? 'text-marca' : 'text-suave')} aria-hidden />
              <span className="text-sm font-medium">{c.nome}</span>
            </label>
          );
        })}
      </div>
      {erro && (
        <p className="mt-1.5 text-xs text-perigo" role="alert">
          {erro}
        </p>
      )}
    </fieldset>
  );
}

export function FormularioSolicitacaoPage() {
  const params = useParams();
  const id = params.id ? Number(params.id) : undefined;
  const edicao = id !== undefined;
  const navegar = useNavigate();

  const categorias = useCategorias();
  const existente = useSolicitacao(id ?? 0);
  const criar = useCriarSolicitacao();
  const atualizar = useAtualizarSolicitacao(id ?? 0);

  const {
    register,
    control,
    handleSubmit,
    reset,
    watch,
    setError,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<Dados>({
    resolver: zodResolver(esquema),
    defaultValues: { titulo: '', descricao: '' },
  });

  useEffect(() => {
    if (existente.data) {
      const { titulo, descricao, categoria } = existente.data;
      reset({ titulo, descricao, categoriaId: categoria.id });
    }
  }, [existente.data, reset]);

  const aoEnviar = handleSubmit(async (dados) => {
    try {
      const salva = edicao ? await atualizar.mutateAsync(dados) : await criar.mutateAsync(dados);
      toast.success(edicao ? 'Solicitação atualizada.' : `Solicitação ${salva.codigo} registrada.`);
      navegar(`/solicitacoes/${salva.id}`, { replace: edicao });
    } catch (erro) {
      if (erro instanceof ApiError && erro.erros.length) {
        // Erros de validação do backend aparecem no próprio campo
        for (const e of erro.erros) {
          const campo = CAMPOS.find((c) => c === e.campo);
          if (campo) setError(campo, { message: e.mensagem });
        }
      } else {
        toast.error(erro instanceof ApiError ? erro.message : 'Não foi possível salvar.');
      }
    }
  });

  const titulo = watch('titulo') ?? '';
  const descricao = watch('descricao') ?? '';
  const voltarPara = edicao ? `/solicitacoes/${id}` : '/solicitacoes';

  const cabecalho = (
    <CabecalhoPagina
      antes={
        <Link
          to={voltarPara}
          className="mb-3 inline-flex items-center gap-1 text-sm text-suave hover:text-texto"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden /> Voltar
        </Link>
      }
      titulo={edicao ? 'Editar solicitação' : 'Nova solicitação'}
      descricao={
        edicao
          ? existente.data?.codigo
          : 'Descreva sua necessidade. A data e o solicitante são registrados automaticamente.'
      }
    />
  );

  if (edicao && existente.isError) {
    return (
      <div className="animate-entrar">
        {cabecalho}
        <div className="cartao">
          <EstadoVazio
            icone={Lock}
            titulo="Solicitação não encontrada"
            descricao={existente.error.message}
            acao={
              <LinkBotao to="/solicitacoes" variante="secundario">
                Ir para a lista
              </LinkBotao>
            }
          />
        </div>
      </div>
    );
  }

  if (edicao && existente.data && !existente.data.permissoes.podeEditar) {
    return (
      <div className="animate-entrar">
        {cabecalho}
        <div className="cartao">
          <EstadoVazio
            icone={Lock}
            titulo="Esta solicitação não pode mais ser editada"
            descricao="Somente o solicitante pode editar, e apenas enquanto o status for Aberto."
            acao={
              <LinkBotao to={voltarPara} variante="secundario">
                Ver detalhes
              </LinkBotao>
            }
          />
        </div>
      </div>
    );
  }

  const carregando = categorias.isPending || (edicao && existente.isPending);

  return (
    <div className="mx-auto max-w-3xl animate-entrar">
      {cabecalho}
      <form onSubmit={aoEnviar} noValidate className="cartao space-y-6 p-5 sm:p-7">
        {carregando ? (
          <div className="space-y-5">
            <Skeleton className="h-20" />
            <Skeleton className="h-10" />
            <Skeleton className="h-40" />
          </div>
        ) : (
          <>
            <Controller
              control={control}
              name="categoriaId"
              render={({ field }) => (
                <SeletorCategoria
                  categorias={categorias.data ?? []}
                  valor={field.value}
                  aoMudar={field.onChange}
                  erro={errors.categoriaId?.message}
                />
              )}
            />

            <Campo
              rotulo="Título"
              obrigatorio
              erro={errors.titulo?.message}
              dica={
                <span className="flex justify-between">
                  <span>Resuma a demanda em uma frase.</span>
                  <Contador atual={titulo.length} maximo={120} />
                </span>
              }
            >
              {(p) => (
                <Input
                  {...p}
                  {...register('titulo')}
                  placeholder="Ex.: Notebook não liga após atualização"
                  maxLength={140}
                />
              )}
            </Campo>

            <Campo
              rotulo="Descrição"
              obrigatorio
              erro={errors.descricao?.message}
              dica={
                <span className="flex justify-between">
                  <span>Inclua detalhes que ajudem no atendimento.</span>
                  <Contador atual={descricao.length} maximo={2000} />
                </span>
              }
            >
              {(p) => (
                <Textarea
                  {...p}
                  {...register('descricao')}
                  rows={7}
                  placeholder="O que aconteceu, desde quando, onde, e o que já foi tentado."
                  maxLength={2100}
                />
              )}
            </Campo>
          </>
        )}

        <div className="flex flex-col-reverse gap-2 border-t border-borda pt-5 sm:flex-row sm:justify-end">
          <LinkBotao to={voltarPara} variante="secundario">
            Cancelar
          </LinkBotao>
          <Button type="submit" carregando={isSubmitting} disabled={carregando || (edicao && !isDirty)}>
            {edicao ? 'Salvar alterações' : 'Registrar solicitação'}
          </Button>
        </div>
      </form>
    </div>
  );
}
