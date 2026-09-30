import './config/load-env';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { configurarAplicacao, PREFIXO_API } from './app.setup';
import { validateEnv } from './config/env.validation';
import { pgConfigFromEnv } from './database/connection';
import { executarMigrations, resolverDiretorioMigrations } from './database/migration-runner';

async function bootstrap() {
  const env = validateEnv(process.env);
  const logger = new Logger('Bootstrap');
  if (env.NODE_ENV === 'production' && !env.COOKIE_SECURE) {
    // Não bloqueia (a avaliação roda em HTTP local), mas deixa o alerta explícito.
    logger.warn('COOKIE_SECURE=false em produção: habilite ao servir a aplicação via HTTPS.');
  }

  if (env.DATABASE_MIGRATE_ON_START) {
    await executarMigrations(
      pgConfigFromEnv(env),
      resolverDiretorioMigrations(env.MIGRATIONS_DIR),
      { log: (m: string) => logger.log(m), error: (m: string) => logger.error(m) },
    );
  }

  const app = await NestFactory.create(AppModule, { bodyParser: false });
  configurarAplicacao(app);
  app.enableShutdownHooks();

  await app.listen(env.PORT, '0.0.0.0');
  logger.log(`API disponível em http://localhost:${env.PORT}/${PREFIXO_API}`);
  if (env.SWAGGER_ENABLED) {
    logger.log(`Documentação em http://localhost:${env.PORT}/${PREFIXO_API}/docs`);
  }
}

bootstrap().catch((erro: Error) => {
  new Logger('Bootstrap').error(erro.message, erro.stack);
  process.exit(1);
});
