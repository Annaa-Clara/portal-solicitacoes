import {
  Ator,
  formatarCodigo,
  podeModificar,
  transicoesPermitidas,
} from './domain/regras-solicitacao';
import {
  HistoricoDto,
  SolicitacaoDetalheDto,
  SolicitacaoItemDto,
} from './dto/solicitacao-resposta.dto';
import { HistoricoStatus } from './historico-status.entity';
import { Solicitacao } from './solicitacao.entity';

export function paraItem(s: Solicitacao): SolicitacaoItemDto {
  return {
    id: s.id,
    codigo: formatarCodigo(s.id),
    titulo: s.titulo,
    categoria: { id: s.categoria.id, nome: s.categoria.nome },
    solicitante: { id: s.solicitante.id, nome: s.solicitante.nome },
    status: s.status,
    criadoEm: s.criadoEm.toISOString(),
    atualizadoEm: s.atualizadoEm.toISOString(),
  };
}

export function paraHistorico(h: HistoricoStatus): HistoricoDto {
  return {
    id: h.id,
    statusAnterior: h.statusAnterior,
    statusNovo: h.statusNovo,
    usuario: { id: h.usuario.id, nome: h.usuario.nome },
    observacao: h.observacao,
    criadoEm: h.criadoEm.toISOString(),
  };
}

export function paraDetalhe(s: Solicitacao, ator: Ator): SolicitacaoDetalheDto {
  const modificavel = podeModificar(ator, s);
  return {
    ...paraItem(s),
    descricao: s.descricao,
    concluidoEm: s.concluidoEm ? s.concluidoEm.toISOString() : null,
    historico: [...(s.historico ?? [])]
      .sort((a, b) => a.criadoEm.getTime() - b.criadoEm.getTime() || a.id - b.id)
      .map(paraHistorico),
    permissoes: {
      podeEditar: modificavel,
      podeExcluir: modificavel,
      transicoesPermitidas: transicoesPermitidas(ator, s),
    },
  };
}
