import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { Public } from '../../common/decorators/auth.decorators';

@ApiTags('Saúde')
@Controller('health')
export class HealthController {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  @Public()
  @SkipThrottle()
  @Get()
  @ApiOperation({ summary: 'Verifica se a API e o banco estão disponíveis' })
  async verificar() {
    try {
      await this.dataSource.query('SELECT 1');
      return { status: 'ok', banco: 'ok', horario: new Date().toISOString() };
    } catch {
      throw new ServiceUnavailableException('Banco de dados indisponível.');
    }
  }
}
