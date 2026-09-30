import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SolicitacaoItemDto } from '../../solicitacoes/dto/solicitacao-resposta.dto';

export class IndicadoresDto {
  @ApiProperty({ example: 14 }) total: number;
  @ApiProperty({ example: 4 }) abertas: number;
  @ApiProperty({ example: 4 }) emAtendimento: number;
  @ApiProperty({ example: 6 }) concluidas: number;
  @ApiPropertyOptional({
    example: 26.5,
    nullable: true,
    description: 'Horas entre abertura e conclusão',
  })
  tempoMedioConclusaoHoras: number | null;
}

export class CategoriaIndicadorDto {
  @ApiProperty() categoriaId: number;
  @ApiProperty() categoria: string;
  @ApiProperty() total: number;
  @ApiProperty() abertas: number;
  @ApiProperty() emAtendimento: number;
  @ApiProperty() concluidas: number;
}

export class EvolucaoDiariaDto {
  @ApiProperty({ example: '2026-09-29' }) dia: string;
  @ApiProperty() abertas: number;
  @ApiProperty() concluidas: number;
}

export class DashboardDto {
  @ApiProperty({ type: IndicadoresDto }) indicadores: IndicadoresDto;
  @ApiProperty({ type: CategoriaIndicadorDto, isArray: true })
  porCategoria: CategoriaIndicadorDto[];
  @ApiProperty({ type: EvolucaoDiariaDto, isArray: true }) evolucao: EvolucaoDiariaDto[];
  @ApiProperty({ type: SolicitacaoItemDto, isArray: true }) recentes: SolicitacaoItemDto[];
}
