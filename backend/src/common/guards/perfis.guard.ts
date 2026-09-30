import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { PERFIS_KEY } from '../decorators/auth.decorators';
import { Perfil } from '../enums';

@Injectable()
export class PerfisGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const perfis = this.reflector.getAllAndOverride<Perfil[] | undefined>(PERFIS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!perfis || perfis.length === 0) return true;

    const { usuario } = context.switchToHttp().getRequest<Request>();
    if (!usuario || !perfis.includes(usuario.perfil)) {
      throw new ForbiddenException('Seu perfil não tem permissão para esta operação.');
    }
    return true;
  }
}
