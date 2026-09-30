import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsPositive, IsString, Length } from 'class-validator';
import { Aparar } from '../../../common/dto/transformers';

/** Usado tanto na criação (POST) quanto na edição (PUT). */
export class SalvarSolicitacaoDto {
  @ApiProperty({ example: 'Notebook não liga', minLength: 5, maxLength: 120 })
  @Aparar()
  @IsString({ message: 'Título deve ser um texto.' })
  @IsNotEmpty({ message: 'Informe o título.' })
  @Length(5, 120, { message: 'Título deve ter entre 5 e 120 caracteres.' })
  titulo: string;

  @ApiProperty({
    example: 'Após a atualização o equipamento não inicia.',
    minLength: 10,
    maxLength: 2000,
  })
  @Aparar()
  @IsString({ message: 'Descrição deve ser um texto.' })
  @IsNotEmpty({ message: 'Informe a descrição.' })
  @Length(10, 2000, { message: 'Descrição deve ter entre 10 e 2000 caracteres.' })
  descricao: string;

  @ApiProperty({ example: 1 })
  @Type(() => Number)
  @IsInt({ message: 'Selecione uma categoria válida.' })
  @IsPositive({ message: 'Selecione uma categoria válida.' })
  categoriaId: number;
}
