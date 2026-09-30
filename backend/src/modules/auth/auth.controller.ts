import { Body, Controller, Get, HttpCode, HttpStatus, Post, Req, Res } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiTooManyRequestsResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { CookieOptions, Request, Response } from 'express';
import { Public, UsuarioAtual } from '../../common/decorators/auth.decorators';
import { UsuarioAutenticado } from '../../common/types';
import { EnvironmentVariables } from '../../config/env.validation';
import { COOKIE_SESSAO } from './auth.constants';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { UsuarioSessaoDto } from './dto/usuario-sessao.dto';
import { SessaoService } from './sessao.service';

@ApiTags('Autenticação')
@Controller('auth')
export class AuthController {
  private readonly cookieBase: CookieOptions;

  constructor(
    private readonly auth: AuthService,
    private readonly sessoes: SessaoService,
    config: ConfigService<EnvironmentVariables, true>,
  ) {
    this.cookieBase = {
      httpOnly: true, // inacessível a JavaScript (mitiga roubo de sessão via XSS)
      sameSite: 'strict', // não é enviado em requisições de outros sites (mitiga CSRF)
      secure: config.get('COOKIE_SECURE', { infer: true }),
      path: '/api',
    };
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @ApiOperation({ summary: 'Autentica o usuário e inicia a sessão (cookie HttpOnly)' })
  @ApiOkResponse({ type: UsuarioSessaoDto })
  @ApiUnauthorizedResponse({ description: 'Usuário ou senha inválidos' })
  @ApiTooManyRequestsResponse({ description: 'Mais de 5 tentativas por minuto' })
  async login(
    @Body() dto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<UsuarioSessaoDto> {
    const { sessao, usuario } = await this.auth.login(dto, req.ip, req.header('user-agent'));
    res.cookie(COOKIE_SESSAO, sessao.token, {
      ...this.cookieBase,
      maxAge: this.sessoes.duracaoMaximaEmMs,
    });
    return usuario;
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Encerra a sessão atual (revogação no servidor)' })
  @ApiNoContentResponse()
  async logout(
    @UsuarioAtual() usuario: UsuarioAutenticado,
    @Res({ passthrough: true }) res: Response,
  ): Promise<void> {
    await this.sessoes.revogar(usuario.sessaoId);
    res.clearCookie(COOKIE_SESSAO, this.cookieBase);
  }

  @Get('me')
  @ApiOperation({ summary: 'Retorna o usuário da sessão atual' })
  @ApiOkResponse({ type: UsuarioSessaoDto })
  me(@UsuarioAtual() usuario: UsuarioAutenticado): UsuarioSessaoDto {
    return AuthService.paraDto(usuario);
  }
}
