import { ForbiddenException, Injectable, NestMiddleware } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NextFunction, Request, Response } from 'express';
import { EnvironmentVariables } from '../../config/env.validation';

const METODOS_SEGUROS = new Set(['GET', 'HEAD', 'OPTIONS']);

/**
 * Defesa em profundidade contra CSRF. O cookie de sessão já é SameSite=Strict;
 * além disso, requisições que alteram dados vindas de navegador precisam ter
 * Origin igual ao host da API ou presente na lista CORS_ORIGINS.
 */
@Injectable()
export class OriginCheckMiddleware implements NestMiddleware {
  private readonly permitidas: Set<string>;

  constructor(config: ConfigService<EnvironmentVariables, true>) {
    this.permitidas = new Set(
      config
        .get('CORS_ORIGINS', { infer: true })
        .split(',')
        .map((o) => o.trim())
        .filter(Boolean),
    );
  }

  use(req: Request, _res: Response, next: NextFunction) {
    if (METODOS_SEGUROS.has(req.method)) return next();

    const origin = req.header('origin');
    if (!origin) return next(); // clientes não-navegador (curl, testes, integrações)

    let hostOrigin: string;
    try {
      hostOrigin = new URL(origin).host;
    } catch {
      throw new ForbiddenException('Origem da requisição inválida.');
    }
    const hostRequisicao = req.header('x-forwarded-host') ?? req.header('host');
    if (hostOrigin === hostRequisicao || this.permitidas.has(origin)) return next();

    throw new ForbiddenException('Origem da requisição não autorizada.');
  }
}
