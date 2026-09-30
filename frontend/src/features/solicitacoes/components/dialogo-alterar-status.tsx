import { useEffect, useId, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/campos';
import { Dialogo } from '@/components/ui/dialogo';
import { ApiError } from '@/lib/api';
import { STATUS } from '@/lib/status';
import type { SolicitacaoDetalhe, Status } from '@/types/api';
import { useAlterarStatus } from '../api';

interface Props {
  solicitacao: SolicitacaoDetalhe;
  destino: Status | null;
  aoFechar: () => void;
}

export function DialogoAlterarStatus({ solicitacao, destino, aoFechar }: Props) {
  const idObs = useId();
  const [observacao, setObservacao] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const alterar = useAlterarStatus(solicitacao.id);

  useEffect(() => {
    setObservacao('');
    setErro(null);
  }, [destino]);

  if (!destino) return null;
  const devolucao = destino === 'ABERTO';

  const confirmar = async () => {
    if (devolucao && !observacao.trim()) {
      setErro('Informe o motivo ao devolver a solicitação para Aberto.');
      return;
    }
    try {
      await alterar.mutateAsync({ status: destino, observacao: observacao.trim() || undefined });
      toast.success(`Status alterado para ${STATUS[destino].rotulo}.`);
      aoFechar();
    } catch (e) {
      const mensagem =
        e instanceof ApiError
          ? (e.erroDoCampo('observacao') ?? e.message)
          : 'Não foi possível alterar o status.';
      setErro(mensagem);
    }
  };

  return (
    <Dialogo
      aberto
      aoFechar={aoFechar}
      titulo={STATUS[destino].acao}
      descricao={
        <>
          {solicitacao.codigo} passará de <strong>{STATUS[solicitacao.status].rotulo}</strong> para{' '}
          <strong>{STATUS[destino].rotulo}</strong>. A mudança fica registrada no histórico.
        </>
      }
      rodape={
        <>
          <Button variante="secundario" onClick={aoFechar}>
            Cancelar
          </Button>
          <Button onClick={confirmar} carregando={alterar.isPending}>
            Confirmar
          </Button>
        </>
      }
    >
      <label htmlFor={idObs} className="mb-1.5 block text-sm font-medium">
        {devolucao ? 'Motivo da devolução' : 'Observação'}
        {devolucao ? (
          <span className="ml-0.5 text-perigo">*</span>
        ) : (
          <span className="ml-1 font-normal text-suave">(opcional)</span>
        )}
      </label>
      <Textarea
        id={idObs}
        value={observacao}
        onChange={(e) => {
          setObservacao(e.target.value);
          setErro(null);
        }}
        maxLength={500}
        rows={4}
        className="min-h-24"
        aria-invalid={Boolean(erro)}
        placeholder={
          devolucao
            ? 'O que o solicitante precisa complementar?'
            : 'Informação útil para quem acompanha a solicitação.'
        }
      />
      <div className="mt-1.5 flex justify-between text-xs">
        <span className="text-perigo" role={erro ? 'alert' : undefined}>
          {erro}
        </span>
        <span className="tabular-nums text-suave">{observacao.length}/500</span>
      </div>
    </Dialogo>
  );
}
