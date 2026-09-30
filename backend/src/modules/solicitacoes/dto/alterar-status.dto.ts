import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { Aparar, VazioParaUndefined } from '../../../common/dto/transformers';
import { StatusSolicitacao } from '../../../common/enums';

export class AlterarStatusDto {
  @ApiProperty({ enum: StatusSolicitacao, example: StatusSolicitacao.EM_ATENDIMENTO })
  @IsEnum(StatusSolicitacao, {
    message: 'Status deve ser ABERTO, EM_ATENDIMENTO ou CONCLUIDO.',
  })
  status: StatusSolicitacao;

  @ApiPropertyOptional({ example: 'Equipamento recolhido para diagnóstico.', maxLength: 500 })
  @Aparar()
  @VazioParaUndefined()
  @IsOptional()
  @IsString({ message: 'Observação deve ser um texto.' })
  @MaxLength(500, { message: 'Observação deve ter no máximo 500 caracteres.' })
  observacao?: string;
}
