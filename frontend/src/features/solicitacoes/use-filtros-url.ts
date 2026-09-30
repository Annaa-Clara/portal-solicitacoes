import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { FiltroSolicitacoes, Status } from '@/types/api';

const STATUS_VALIDOS: Status[] = ['ABERTO', 'EM_ATENDIMENTO', 'CONCLUIDO'];
const ORDENACOES = ['criadoEm', 'titulo', 'status', 'id'] as const;

export const TAMANHO_PAGINA = 10;

/**
 * Os filtros vivem na URL: a consulta pode ser compartilhada por link,
 * sobrevive a um F5 e o botão "voltar" do navegador funciona como esperado.
 */
export function useFiltrosUrl() {
  const [params, setParams] = useSearchParams();

  const filtro = useMemo<FiltroSolicitacoes>(() => {
    const status = params.get('status') as Status | null;
    const ordenarPor = params.get('ordenarPor') as FiltroSolicitacoes['ordenarPor'] | null;
    const categoriaId = Number(params.get('categoriaId'));
    const pagina = Number(params.get('pagina'));
    return {
      pagina: Number.isInteger(pagina) && pagina > 0 ? pagina : 1,
      tamanho: TAMANHO_PAGINA,
      status: status && STATUS_VALIDOS.includes(status) ? status : undefined,
      categoriaId: Number.isInteger(categoriaId) && categoriaId > 0 ? categoriaId : undefined,
      dataInicio: params.get('dataInicio') || undefined,
      dataFim: params.get('dataFim') || undefined,
      texto: params.get('texto') || undefined,
      ordenarPor: ordenarPor && ORDENACOES.includes(ordenarPor) ? ordenarPor : 'criadoEm',
      direcao: params.get('direcao') === 'asc' ? 'asc' : 'desc',
    };
  }, [params]);

  /** Atualiza filtros; qualquer mudança que não seja de página volta para a página 1. */
  const atualizar = (mudancas: Partial<FiltroSolicitacoes>) => {
    setParams(
      (atual) => {
        const proximo = new URLSearchParams(atual);
        for (const [chave, valor] of Object.entries(mudancas)) {
          if (valor === undefined || valor === '' || valor === null) proximo.delete(chave);
          else proximo.set(chave, String(valor));
        }
        if (!('pagina' in mudancas)) proximo.delete('pagina');
        if (proximo.get('pagina') === '1') proximo.delete('pagina');
        return proximo;
      },
      { replace: !('pagina' in mudancas) },
    );
  };

  const limpar = () => setParams(new URLSearchParams(), { replace: true });

  const quantidadeAtivos = [
    filtro.status,
    filtro.categoriaId,
    filtro.dataInicio,
    filtro.dataFim,
    filtro.texto,
  ].filter(Boolean).length;

  return { filtro, atualizar, limpar, quantidadeAtivos };
}
