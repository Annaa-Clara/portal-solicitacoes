import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UsuarioAtual } from '../../common/decorators/auth.decorators';
import { UsuarioAutenticado } from '../../common/types';
import { DashboardService } from './dashboard.service';
import { DashboardDto } from './dto/dashboard.dto';

@ApiTags('Dashboard')
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly service: DashboardService) {}

  @Get()
  @ApiOperation({ summary: 'Indicadores de solicitações (escopo conforme o perfil)' })
  @ApiOkResponse({ type: DashboardDto })
  obter(@UsuarioAtual() usuario: UsuarioAutenticado): Promise<DashboardDto> {
    return this.service.obter(usuario);
  }
}
