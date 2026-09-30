import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProblemDetailsFilter } from './common/filters/problem-details.filter';
import { PerfisGuard } from './common/guards/perfis.guard';
import { OriginCheckMiddleware } from './common/middleware/origin-check.middleware';
import { RequestIdMiddleware } from './common/middleware/request-id.middleware';
import { EnvironmentVariables, validateEnv } from './config/env.validation';
import { typeOrmOptions } from './database/typeorm.config';
import { AuthModule } from './modules/auth/auth.module';
import { SessaoGuard } from './modules/auth/sessao.guard';
import { CategoriasModule } from './modules/categorias/categorias.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { HealthController } from './modules/health/health.controller';
import { SolicitacoesModule } from './modules/solicitacoes/solicitacoes.module';

@Module({
  imports: [
    // O .env é carregado em process.env pelo main.ts (sem sobrescrever variáveis já
    // definidas), então o ambiente real (Docker, CI, testes) sempre tem precedência.
    ConfigModule.forRoot({
      isGlobal: true,
      ignoreEnvFile: true,
      validate: validateEnv,
      cache: true,
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService<EnvironmentVariables, true>) =>
        typeOrmOptions({
          NODE_ENV: config.get('NODE_ENV', { infer: true }),
          DATABASE_HOST: config.get('DATABASE_HOST', { infer: true }),
          DATABASE_PORT: config.get('DATABASE_PORT', { infer: true }),
          DATABASE_USER: config.get('DATABASE_USER', { infer: true }),
          DATABASE_PASSWORD: config.get('DATABASE_PASSWORD', { infer: true }),
          DATABASE_NAME: config.get('DATABASE_NAME', { infer: true }),
        }),
    }),
    // Limite global generoso; o login tem limite próprio e bem mais restrito.
    ThrottlerModule.forRoot([{ name: 'default', ttl: 60_000, limit: 300 }]),
    AuthModule,
    CategoriasModule,
    SolicitacoesModule,
    DashboardModule,
  ],
  controllers: [HealthController],
  providers: [
    // Ordem importa: limite de taxa -> autenticação -> autorização por perfil.
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: SessaoGuard },
    { provide: APP_GUARD, useClass: PerfisGuard },
    { provide: APP_FILTER, useClass: ProblemDetailsFilter },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(RequestIdMiddleware, OriginCheckMiddleware)
      .forRoutes({ path: '{*caminho}', method: RequestMethod.ALL });
  }
}
