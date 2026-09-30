import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { IS_PUBLIC_KEY } from '../../common/decorators/auth.decorators';
import { COOKIE_SESSAO } from './auth.constants';
import { SessaoService } from './sessao.service';

/** Guard global: toda rota exige sessão válida, exceto as marcadas com @Public(). */
@Injectable()
export class SessaoGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly sessoes: SessaoService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const publica = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (publica) return true;

    const request = context.switchToHttp().getRequest<Request>();
    const token = (request.cookies as Record<string, string> | undefined)?.[COOKIE_SESSAO];
    const usuario = token ? await this.sessoes.validar(token) : null;

    if (!usuario) {
      throw new UnauthorizedException('Sessão inválida ou expirada. Faça login novamente.');
    }
    request.usuario = usuario;
    return true;
  }
}
