import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { StatusSolicitacao } from '../../../common/enums';

export class ReferenciaDto {
  @ApiProperty() id: number;
  @ApiProperty() nome: string;
}

export class SolicitacaoItemDto {
  @ApiProperty({ example: 12 }) id: number;
  @ApiProperty({ example: 'SOL-000012' }) codigo: string;
  @ApiProperty() titulo: string;
  @ApiProperty({ type: ReferenciaDto }) categoria: ReferenciaDto;
  @ApiProperty({ type: ReferenciaDto }) solicitante: ReferenciaDto;
  @ApiProperty({ enum: StatusSolicitacao }) status: StatusSolicitacao;
  @ApiProperty() criadoEm: string;
  @ApiProperty() atualizadoEm: string;
}

export class HistoricoDto {
  @ApiProperty() id: number;
  @ApiPropertyOptional({ enum: StatusSolicitacao, nullable: true })
  statusAnterior: StatusSolicitacao | null;
  @ApiProperty({ enum: StatusSolicitacao }) statusNovo: StatusSolicitacao;
  @ApiProperty({ type: ReferenciaDto }) usuario: ReferenciaDto;
  @ApiPropertyOptional({ nullable: true }) observacao: string | null;
  @ApiProperty() criadoEm: string;
}

/** Ações que o usuário atual pode executar: o frontend não duplica as regras. */
export class PermissoesDto {
  @ApiProperty() podeEditar: boolean;
  @ApiProperty() podeExcluir: boolean;
  @ApiProperty({ enum: StatusSolicitacao, isArray: true })
  transicoesPermitidas: StatusSolicitacao[];
}

export class SolicitacaoDetalheDto extends SolicitacaoItemDto {
  @ApiProperty() descricao: string;
  @ApiPropertyOptional({ nullable: true }) concluidoEm: string | null;
  @ApiProperty({ type: HistoricoDto, isArray: true }) historico: HistoricoDto[];
  @ApiProperty({ type: PermissoesDto }) permissoes: PermissoesDto;
}

export class SolicitacaoPaginaDto {
  @ApiProperty({ type: SolicitacaoItemDto, isArray: true }) itens: SolicitacaoItemDto[];
  @ApiProperty() pagina: number;
  @ApiProperty() tamanho: number;
  @ApiProperty() total: number;
  @ApiProperty() totalPaginas: number;
}
