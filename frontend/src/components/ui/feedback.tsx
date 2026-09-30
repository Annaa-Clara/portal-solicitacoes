import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-lg bg-elevada', className)} aria-hidden />;
}

interface EstadoVazioProps {
  icone: LucideIcon;
  titulo: string;
  descricao?: ReactNode;
  acao?: ReactNode;
  className?: string;
}

export function EstadoVazio({ icone: Icone, titulo, descricao, acao, className }: EstadoVazioProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center px-6 py-14 text-center', className)}>
      <div className="mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-marca-fundo text-marca">
        <Icone className="h-6 w-6" aria-hidden />
      </div>
      <h3 className="text-base font-semibold">{titulo}</h3>
      {descricao && <p className="mt-1 max-w-sm text-sm text-suave">{descricao}</p>}
      {acao && <div className="mt-5">{acao}</div>}
    </div>
  );
}

interface CabecalhoPaginaProps {
  titulo: string;
  descricao?: ReactNode;
  acoes?: ReactNode;
  antes?: ReactNode;
}

export function CabecalhoPagina({ titulo, descricao, acoes, antes }: CabecalhoPaginaProps) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {antes}
        <h1 className="text-2xl font-semibold tracking-tight sm:text-[1.7rem]">{titulo}</h1>
        {descricao && <p className="mt-1 text-sm text-suave">{descricao}</p>}
      </div>
      {acoes && <div className="flex shrink-0 flex-wrap gap-2">{acoes}</div>}
    </div>
  );
}
