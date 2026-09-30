import { Link } from 'react-router-dom';
import { LISTA_STATUS, STATUS } from '@/lib/status';
import type { Dashboard } from '@/types/api';

const CAMPO = { ABERTO: 'abertas', EM_ATENDIMENTO: 'emAtendimento', CONCLUIDO: 'concluidas' } as const;

/** Barras empilhadas por status, com números visíveis (a cor nunca é o único código). */
export function DistribuicaoCategorias({ dados }: { dados: Dashboard['porCategoria'] }) {
  const maior = Math.max(1, ...dados.map((d) => d.total));

  return (
    <div>
      <ul className="mb-4 flex flex-wrap gap-x-4 gap-y-1" aria-label="Legenda">
        {LISTA_STATUS.map((s) => (
          <li key={s} className="flex items-center gap-1.5 text-xs text-suave">
            <span className={`h-2.5 w-2.5 rounded-sm ${STATUS[s].ponto}`} aria-hidden />
            {STATUS[s].rotulo}
          </li>
        ))}
      </ul>
      <ul className="space-y-3.5">
        {dados.map((c) => (
          <li key={c.categoriaId}>
            <Link
              to={`/solicitacoes?categoriaId=${c.categoriaId}`}
              className="group block rounded-lg outline-offset-4"
              title={LISTA_STATUS.map((s) => `${STATUS[s].rotulo}: ${c[CAMPO[s]]}`).join(' · ')}
            >
              <div className="mb-1.5 flex items-baseline justify-between text-sm">
                <span className="font-medium group-hover:text-marca">{c.categoria}</span>
                <span className="tabular-nums text-suave">
                  <span className="font-semibold text-texto">{c.total}</span>
                  <span className="sr-only">
                    {' '}
                    solicitações: {LISTA_STATUS.map((s) => `${c[CAMPO[s]]} ${STATUS[s].rotulo}`).join(', ')}
                  </span>
                </span>
              </div>
              <div className="flex h-2.5 overflow-hidden rounded-full bg-elevada" aria-hidden>
                <div className="flex h-full gap-[2px]" style={{ width: `${(c.total / maior) * 100}%` }}>
                  {LISTA_STATUS.map((s) =>
                    c[CAMPO[s]] > 0 ? (
                      <div
                        key={s}
                        className={`h-full ${STATUS[s].ponto} first:rounded-l-full last:rounded-r-full`}
                        style={{ flexGrow: c[CAMPO[s]] }}
                      />
                    ) : null,
                  )}
                </div>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
