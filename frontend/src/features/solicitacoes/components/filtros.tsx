import { SlidersHorizontal, Search, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input, Select } from '@/components/ui/campos';
import { useDebounce } from '@/hooks/use-debounce';
import { cn } from '@/lib/utils';
import { LISTA_STATUS, STATUS } from '@/lib/status';
import type { Categoria, FiltroSolicitacoes, Status } from '@/types/api';

interface FiltrosProps {
  filtro: FiltroSolicitacoes;
  categorias: Categoria[];
  quantidadeAtivos: number;
  aoMudar: (m: Partial<FiltroSolicitacoes>) => void;
  aoLimpar: () => void;
}

const rotulo = 'mb-1 block text-xs font-medium text-suave';

export function Filtros({ filtro, categorias, quantidadeAtivos, aoMudar, aoLimpar }: FiltrosProps) {
  const [texto, setTexto] = useState(filtro.texto ?? '');
  const textoAtrasado = useDebounce(texto.trim(), 350);

  // Busca enquanto digita, com debounce (sem uma requisição por tecla).
  useEffect(() => {
    if (textoAtrasado !== (filtro.texto ?? '')) aoMudar({ texto: textoAtrasado || undefined });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [textoAtrasado]);

  // Mantém o campo sincronizado quando o filtro muda por fora (ex.: "Limpar").
  useEffect(() => {
    setTexto((atual) => (atual.trim() === (filtro.texto ?? '') ? atual : (filtro.texto ?? '')));
  }, [filtro.texto]);

  const [expandido, setExpandido] = useState(false);
  const avancadosAtivos = quantidadeAtivos - (filtro.texto ? 1 : 0);
  const periodoInvalido = Boolean(filtro.dataInicio && filtro.dataFim && filtro.dataInicio > filtro.dataFim);

  return (
    <div className="border-b border-borda p-4 sm:p-5">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-12">
        <div className="min-w-0 sm:col-span-2 lg:col-span-4">
          <label htmlFor="f-texto" className={rotulo}>
            Buscar
          </label>
          <div className="flex gap-2">
            <div className="relative min-w-0 flex-1">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-suave"
                aria-hidden
              />
              <Input
                id="f-texto"
                type="search"
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
                placeholder="Título ou código (SOL-000012)"
                className="pl-9"
                maxLength={120}
              />
            </div>
            <Button
              type="button"
              variante="secundario"
              className="relative h-10 lg:hidden"
              onClick={() => setExpandido((v) => !v)}
              aria-expanded={expandido}
              aria-controls="filtros-avancados"
            >
              <SlidersHorizontal className="h-4 w-4" aria-hidden />
              <span className="sr-only sm:not-sr-only">Filtros</span>
              {avancadosAtivos > 0 && (
                <span className="absolute -right-1.5 -top-1.5 grid h-5 min-w-5 place-items-center rounded-full bg-marca px-1 text-[11px] font-semibold text-white dark:text-slate-950">
                  {avancadosAtivos}
                </span>
              )}
            </Button>
          </div>
        </div>

        <div id="filtros-avancados" className={cn('contents', !expandido && 'max-lg:hidden')}>
          <div className="min-w-0 lg:col-span-2">
            <label htmlFor="f-status" className={rotulo}>
              Status
            </label>
            <Select
              id="f-status"
              value={filtro.status ?? ''}
              onChange={(e) => aoMudar({ status: (e.target.value || undefined) as Status | undefined })}
            >
              <option value="">Todos</option>
              {LISTA_STATUS.map((s) => (
                <option key={s} value={s}>
                  {STATUS[s].rotulo}
                </option>
              ))}
            </Select>
          </div>

          <div className="min-w-0 lg:col-span-2">
            <label htmlFor="f-categoria" className={rotulo}>
              Categoria
            </label>
            <Select
              id="f-categoria"
              value={filtro.categoriaId ?? ''}
              onChange={(e) => aoMudar({ categoriaId: e.target.value ? Number(e.target.value) : undefined })}
            >
              <option value="">Todas</option>
              {categorias.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome}
                </option>
              ))}
            </Select>
          </div>

          <fieldset className="min-w-0 sm:col-span-2 lg:col-span-4">
            <legend className={rotulo}>Período de abertura</legend>
            <div className="flex min-w-0 items-center gap-2">
              <Input
                type="date"
                className="min-w-0"
                aria-label="Data inicial"
                value={filtro.dataInicio ?? ''}
                max={filtro.dataFim}
                onChange={(e) => aoMudar({ dataInicio: e.target.value || undefined })}
                aria-invalid={periodoInvalido}
              />
              <span className="text-xs text-suave">até</span>
              <Input
                type="date"
                className="min-w-0"
                aria-label="Data final"
                value={filtro.dataFim ?? ''}
                min={filtro.dataInicio}
                onChange={(e) => aoMudar({ dataFim: e.target.value || undefined })}
                aria-invalid={periodoInvalido}
              />
            </div>
          </fieldset>
        </div>
      </div>

      {quantidadeAtivos > 0 && (
        <div className="mt-3 flex items-center justify-between gap-3">
          <p className="text-xs text-suave">
            {quantidadeAtivos} {quantidadeAtivos === 1 ? 'filtro ativo' : 'filtros ativos'}
          </p>
          <Button
            variante="fantasma"
            tamanho="sm"
            onClick={() => {
              setTexto('');
              aoLimpar();
            }}
          >
            <X className="h-3.5 w-3.5" aria-hidden /> Limpar filtros
          </Button>
        </div>
      )}
    </div>
  );
}
