import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './button';

interface PaginacaoProps {
  pagina: number;
  totalPaginas: number;
  total: number;
  tamanho: number;
  aoMudar: (pagina: number) => void;
}

export function Paginacao({ pagina, totalPaginas, total, tamanho, aoMudar }: PaginacaoProps) {
  const inicio = total === 0 ? 0 : (pagina - 1) * tamanho + 1;
  const fim = Math.min(pagina * tamanho, total);
  return (
    <nav
      className="flex items-center justify-between gap-3 border-t border-borda px-4 py-3 sm:px-5"
      aria-label="Paginação"
    >
      <p className="text-xs text-suave sm:text-sm">
        <span className="font-medium text-texto">
          {inicio}–{fim}
        </span>{' '}
        de <span className="font-medium text-texto">{total}</span>
      </p>
      <div className="flex items-center gap-1.5">
        <Button
          variante="secundario"
          tamanho="sm"
          onClick={() => aoMudar(pagina - 1)}
          disabled={pagina <= 1}
          aria-label="Página anterior"
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Anterior</span>
        </Button>
        <span className="px-2 text-xs tabular-nums text-suave">
          {pagina}/{totalPaginas}
        </span>
        <Button
          variante="secundario"
          tamanho="sm"
          onClick={() => aoMudar(pagina + 1)}
          disabled={pagina >= totalPaginas}
          aria-label="Próxima página"
        >
          <span className="hidden sm:inline">Próxima</span>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </nav>
  );
}
