import { Module } from '@nestjs/common';
import { SolicitacoesModule } from '../solicitacoes/solicitacoes.module';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';

@Module({
  imports: [SolicitacoesModule],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
