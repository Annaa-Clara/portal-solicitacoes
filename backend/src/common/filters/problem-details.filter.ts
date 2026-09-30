import {
  ArgumentsHost,
  BadRequestException,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { ThrottlerException } from '@nestjs/throttler';
import { ValidationError } from 'class-validator';
import { Request, Response } from 'express';
import { QueryFailedError } from 'typeorm';

export interface ErroCampo {
  campo: string;
  mensagem: string;
}

/** Corpo de erro padronizado no formato RFC 9457 (Problem Details for HTTP APIs). */
export interface ProblemDetails {
  type: string;
  title: string;
  status: number;
  detail: string;
  instance: string;
  requestId?: string;
  timestamp: string;
  erros?: ErroCampo[];
}

const TITULOS: Record<number, string> = {
  400: 'Requisição inválida',
  401: 'Não autenticado',
  403: 'Acesso negado',
  404: 'Recurso não encontrado',
  409: 'Conflito com o estado atual',
  413: 'Requisição muito grande',
  422: 'Regra de negócio violada',
  429: 'Muitas requisições',
  500: 'Erro interno',
};

/** Exceção lançada pelo ValidationPipe, já com os erros achatados por campo. */
export class ValidacaoException extends BadRequestException {
  constructor(public readonly erros: ErroCampo[]) {
    super('Um ou mais campos são inválidos.');
  }

  static fromValidationErrors(errors: ValidationError[], prefixo = ''): ValidacaoException {
    const achatar = (lista: ValidationError[], base: string): ErroCampo[] =>
      lista.flatMap((e) => {
        const campo = base ? `${base}.${e.property}` : e.property;
        const proprios = Object.entries(e.constraints ?? {}).map(([regra, mensagem]) => ({
          campo,
          mensagem: regra === 'whitelistValidation' ? 'Campo não permitido.' : mensagem,
        }));
        return [...proprios, ...achatar(e.children ?? [], campo)];
      });
    return new ValidacaoException(achatar(errors, prefixo));
  }
}

@Catch()
export class ProblemDetailsFilter implements ExceptionFilter {
  private readonly logger = new Logger('HTTP');

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const req = ctx.getRequest<Request>();
    const res = ctx.getResponse<Response>();

    const { status, detail, erros } = this.mapear(exception);

    if (status >= 500) {
      this.logger.error(
        `[${req.requestId}] ${req.method} ${req.originalUrl} -> ${status}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    }

    const body: ProblemDetails = {
      type: 'about:blank',
      title: TITULOS[status] ?? 'Erro',
      status,
      detail,
      instance: req.originalUrl,
      requestId: req.requestId,
      timestamp: new Date().toISOString(),
      ...(erros ? { erros } : {}),
    };

    res.status(status).type('application/problem+json').json(body);
  }

  private mapear(exception: unknown): { status: number; detail: string; erros?: ErroCampo[] } {
    if (exception instanceof ValidacaoException) {
      return { status: 400, detail: exception.message, erros: exception.erros };
    }
    if (exception instanceof ThrottlerException) {
      return {
        status: HttpStatus.TOO_MANY_REQUESTS,
        detail: 'Limite de tentativas excedido. Aguarde alguns instantes e tente novamente.',
      };
    }
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const resposta = exception.getResponse();
      let detail = exception.message;
      if (typeof resposta === 'object' && resposta !== null && 'message' in resposta) {
        const msg = (resposta as { message: unknown }).message;
        detail = Array.isArray(msg) ? msg.join('; ') : String(msg);
      }
      // Mensagens padrão do Express/Nest em inglês (ex.: JSON malformado, rota inexistente)
      if (status === 404 && /^Cannot (GET|POST|PUT|PATCH|DELETE)/.test(detail)) {
        detail = 'O endpoint solicitado não existe.';
      }
      if (status === 400 && /JSON/i.test(detail)) {
        detail = 'O corpo da requisição não é um JSON válido.';
      }
      if (status === 413) detail = 'O corpo da requisição excede o tamanho permitido.';
      return { status, detail };
    }
    if (exception instanceof QueryFailedError) {
      const codigo = (exception as QueryFailedError & { code?: string }).code;
      if (codigo === '23505') return { status: 409, detail: 'Registro duplicado.' };
      if (codigo === '23503') {
        return { status: 409, detail: 'Operação viola um relacionamento entre registros.' };
      }
      if (codigo === '23514') return { status: 400, detail: 'Dados violam uma regra do banco.' };
    }
    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      detail: 'Ocorreu um erro inesperado. Informe o requestId ao suporte.',
    };
  }
}
