import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';

/** Valida identificadores numéricos de rota (/solicitacoes/:id). */
@Injectable()
export class ParseIdPipe implements PipeTransform<string, number> {
  transform(value: string): number {
    if (!/^\d{1,15}$/.test(value) || Number(value) < 1) {
      throw new BadRequestException('Identificador inválido.');
    }
    return Number(value);
  }
}
