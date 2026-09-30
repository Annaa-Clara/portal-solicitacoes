import { createParamDecorator, ExecutionContext, SetMetadata } from '@nestjs/common';
import { Request } from 'express';
import { Perfil } from '../enums';
import { UsuarioAutenticado } from '../types';

export const IS_PUBLIC_KEY = 'isPublic';
export const PERFIS_KEY = 'perfis';

/** Libera a rota da autenticação (por padrão, TODAS as rotas exigem sessão). */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

/** Restringe a rota aos perfis informados. */
export const Perfis = (...perfis: Perfil[]) => SetMetadata(PERFIS_KEY, perfis);

/** Injeta o usuário da sessão atual no handler. */
export const UsuarioAtual = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): UsuarioAutenticado => {
    const request = ctx.switchToHttp().getRequest<Request>();
    return request.usuario as UsuarioAutenticado;
  },
);
