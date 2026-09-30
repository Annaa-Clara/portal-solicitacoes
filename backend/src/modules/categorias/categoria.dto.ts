import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CategoriaDto {
  @ApiProperty({ example: 1 }) id: number;
  @ApiProperty({ example: 'TI' }) nome: string;
  @ApiPropertyOptional({ example: 'Equipamentos, acessos, sistemas e suporte técnico' })
  descricao: string | null;
}
