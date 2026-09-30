import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { ValidacaoException } from './common/filters/problem-details.filter';
import { EnvironmentVariables } from './config/env.validation';
import { COOKIE_SESSAO } from './modules/auth/auth.constants';

export const PREFIXO_API = 'api';

/**
 * Configuração HTTP compartilhada entre a aplicação real (main.ts) e os testes
 * end-to-end, garantindo que os testes exercitem exatamente o mesmo pipeline.
 */
export function configurarAplicacao(app: INestApplication): void {
  const config = app.get<ConfigService<EnvironmentVariables, true>>(ConfigService);
  const express = app as NestExpressApplication;

  if (config.get('TRUST_PROXY', { infer: true })) {
    express.set('trust proxy', 1); // IP real do cliente atrás do Nginx (limite de taxa)
  }
  express.disable('x-powered-by');
  express.useBodyParser('json', { limit: '100kb' });

  app.setGlobalPrefix(PREFIXO_API);
  app.use(helmet());
  app.use(cookieParser());
  app.enableCors({
    origin: config
      .get('CORS_ORIGINS', { infer: true })
      .split(',')
      .map((o) => o.trim())
      .filter(Boolean),
    credentials: true,
    exposedHeaders: ['X-Request-Id'],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true, // converte e aplica defaults dos DTOs
      whitelist: true, // descarta campos não declarados
      forbidNonWhitelisted: true, // e rejeita quem tentar enviá-los (ex.: "status" no POST)
      stopAtFirstError: true, // uma mensagem clara por campo
      exceptionFactory: (erros) => ValidacaoException.fromValidationErrors(erros),
    }),
  );

  if (config.get('SWAGGER_ENABLED', { infer: true })) {
    const documento = new DocumentBuilder()
      .setTitle('Portal de Solicitações Internas - API')
      .setDescription(
        'API REST do portal. A autenticação usa sessão em cookie HttpOnly: ' +
          'faça POST /api/auth/login e as demais rotas passam a aceitar o cookie automaticamente.',
      )
      .setVersion('1.0.0')
      .addCookieAuth(COOKIE_SESSAO)
      .build();
    SwaggerModule.setup(`${PREFIXO_API}/docs`, app, SwaggerModule.createDocument(app, documento), {
      swaggerOptions: { withCredentials: true, persistAuthorization: true },
    });
  }
}
