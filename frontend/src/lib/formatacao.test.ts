import { describe, expect, it } from 'vitest';
import { formatarDiaCurto, formatarDuracaoHoras, formatarRelativo } from './formatacao';

describe('formatação', () => {
  it('formata durações em horas e dias', () => {
    expect(formatarDuracaoHoras(null)).toBe('—');
    expect(formatarDuracaoHoras(3.25)).toBe('3,3 h');
    expect(formatarDuracaoHoras(48)).toBe('2 d');
    expect(formatarDuracaoHoras(29.7)).toBe('1 d 6 h');
  });

  it('formata tempo relativo em português', () => {
    const agora = new Date('2026-09-29T12:00:00Z').getTime();
    expect(formatarRelativo('2026-09-29T11:59:50Z', agora)).toBe('agora');
    expect(formatarRelativo('2026-09-29T09:00:00Z', agora)).toBe('há 3 horas');
    expect(formatarRelativo('2026-09-28T12:00:00Z', agora)).toBe('ontem');
  });

  it('formata dia civil sem deslocar o fuso', () => {
    expect(formatarDiaCurto('2026-09-01')).toMatch(/^01 de set/);
  });
});
