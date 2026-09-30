import { ApiProperty } from '@nestjs/swagger';

export class PaginaDto<T> {
  @ApiProperty({ isArray: true })
  itens: T[];

  @ApiProperty({ example: 1 })
  pagina: number;

  @ApiProperty({ example: 10 })
  tamanho: number;

  @ApiProperty({ example: 42 })
  total: number;

  @ApiProperty({ example: 5 })
  totalPaginas: number;

  static de<T>(itens: T[], total: number, pagina: number, tamanho: number): PaginaDto<T> {
    return { itens, total, pagina, tamanho, totalPaginas: Math.max(1, Math.ceil(total / tamanho)) };
  }
}
