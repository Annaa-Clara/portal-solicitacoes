import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CategoriaDto } from './categoria.dto';
import { CategoriasService } from './categorias.service';

@ApiTags('Categorias')
@Controller('categorias')
export class CategoriasController {
  constructor(private readonly service: CategoriasService) {}

  @Get()
  @ApiOperation({ summary: 'Lista as categorias ativas' })
  @ApiOkResponse({ type: CategoriaDto, isArray: true })
  listar(): Promise<CategoriaDto[]> {
    return this.service.listarAtivas();
  }
}
