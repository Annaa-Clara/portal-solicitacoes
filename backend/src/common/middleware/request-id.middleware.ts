import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { randomUUID } from 'node:crypto';

const FORMATO_VALIDO = /^[\w-]{8,64}$/;

/** Correlaciona logs e respostas de erro com um identificador por requisição. */
@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const recebido = req.header('x-request-id');
    req.requestId = recebido && FORMATO_VALIDO.test(recebido) ? recebido : randomUUID();
    res.setHeader('X-Request-Id', req.requestId);
    next();
  }
}
