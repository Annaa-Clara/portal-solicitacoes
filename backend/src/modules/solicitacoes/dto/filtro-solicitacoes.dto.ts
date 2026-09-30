import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsIn,
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { Aparar, VazioParaUndefined } from '../../../common/dto/transformers';
import { StatusSolicitacao } from '../../../common/enums';

const DATA_ISO = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;

export const CAMPOS_ORDENACAO = ['criadoEm', 'titulo', 'status', 'id'] as const;
export type CampoOrdenacao = (typeof CAMPOS_ORDENACAO)[number];

export class FiltroSolicitacoesDto {
  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @VazioParaUndefined()
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Página deve ser um número inteiro.' })
  @Min(1, { message: 'Página deve ser maior ou igual a 1.' })
  pagina = 1;

  @ApiPropertyOptional({ default: 10, minimum: 1, maximum: 50 })
  @VazioParaUndefined()
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Tamanho deve ser um número inteiro.' })
  @Min(1, { message: 'Tamanho deve estar entre 1 e 50.' })
  @Max(50, { message: 'Tamanho deve estar entre 1 e 50.' })
  tamanho = 10;

  @ApiPropertyOptional({ enum: StatusSolicitacao })
  @VazioParaUndefined()
  @IsOptional()
  @IsEnum(StatusSolicitacao, { message: 'Status inválido.' })
  status?: StatusSolicitacao;

  @ApiPropertyOptional({ example: 1 })
  @VazioParaUndefined()
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Categoria inválida.' })
  @IsPositive({ message: 'Categoria inválida.' })
  categoriaId?: number;

  @ApiPropertyOptional({
    example: '2026-09-01',
    description: 'Data inicial (AAAA-MM-DD), inclusiva',
  })
  @VazioParaUndefined()
  @IsOptional()
  @Matches(DATA_ISO, { message: 'Data inicial deve estar no formato AAAA-MM-DD.' })
  dataInicio?: string;

  @ApiPropertyOptional({ example: '2026-09-30', description: 'Data final (AAAA-MM-DD), inclusiva' })
  @VazioParaUndefined()
  @IsOptional()
  @Matches(DATA_ISO, { message: 'Data final deve estar no formato AAAA-MM-DD.' })
  dataFim?: string;

  @ApiPropertyOptional({ description: 'Busca no título (ou pelo código, ex.: SOL-000012)' })
  @Aparar()
  @VazioParaUndefined()
  @IsOptional()
  @IsString()
  @MaxLength(120, { message: 'Texto de busca deve ter no máximo 120 caracteres.' })
  texto?: string;

  @ApiPropertyOptional({ enum: CAMPOS_ORDENACAO, default: 'criadoEm' })
  @VazioParaUndefined()
  @IsOptional()
  @IsIn(CAMPOS_ORDENACAO, { message: 'Campo de ordenação inválido.' })
  ordenarPor: CampoOrdenacao = 'criadoEm';

  @ApiPropertyOptional({ enum: ['asc', 'desc'], default: 'desc' })
  @VazioParaUndefined()
  @IsOptional()
  @IsIn(['asc', 'desc'], { message: 'Direção deve ser asc ou desc.' })
  direcao: 'asc' | 'desc' = 'desc';
}
