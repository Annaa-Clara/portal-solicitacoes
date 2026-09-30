import { Perfil, StatusSolicitacao as S } from '../../../common/enums';
import {
  exigeObservacao,
  extrairIdDoCodigo,
  formatarCodigo,
  podeAlterarStatus,
  podeModificar,
  podeVisualizar,
  transicaoValida,
  transicoesPermitidas,
} from './regras-solicitacao';

const solicitante = { id: 1, perfil: Perfil.SOLICITANTE };
const outroSolicitante = { id: 2, perfil: Perfil.SOLICITANTE };
const atendente = { id: 3, perfil: Perfil.ATENDENTE };

describe('Regras de negócio da solicitação', () => {
  describe('máquina de estados', () => {
    it.each([
      [S.ABERTO, S.EM_ATENDIMENTO, true],
      [S.EM_ATENDIMENTO, S.CONCLUIDO, true],
      [S.EM_ATENDIMENTO, S.ABERTO, true],
      [S.ABERTO, S.CONCLUIDO, false],
      [S.CONCLUIDO, S.ABERTO, false],
      [S.CONCLUIDO, S.EM_ATENDIMENTO, false],
      [S.ABERTO, S.ABERTO, false],
    ])('%s -> %s é %s', (de, para, esperado) => {
      expect(transicaoValida(de, para)).toBe(esperado);
    });

    it('exige observação apenas ao devolver de Em Atendimento para Aberto', () => {
      expect(exigeObservacao(S.EM_ATENDIMENTO, S.ABERTO)).toBe(true);
      expect(exigeObservacao(S.EM_ATENDIMENTO, S.CONCLUIDO)).toBe(false);
      expect(exigeObservacao(S.ABERTO, S.EM_ATENDIMENTO)).toBe(false);
    });
  });

  describe('permissões', () => {
    const propria = { solicitanteId: 1, status: S.ABERTO };

    it('solicitante visualiza só as próprias; atendente visualiza todas', () => {
      expect(podeVisualizar(solicitante, propria)).toBe(true);
      expect(podeVisualizar(outroSolicitante, propria)).toBe(false);
      expect(podeVisualizar(atendente, propria)).toBe(true);
    });

    it('somente o próprio solicitante modifica, e apenas enquanto aberta', () => {
      expect(podeModificar(solicitante, propria)).toBe(true);
      expect(podeModificar(outroSolicitante, propria)).toBe(false);
      expect(podeModificar(atendente, propria)).toBe(false);
      expect(podeModificar(solicitante, { ...propria, status: S.EM_ATENDIMENTO })).toBe(false);
      expect(podeModificar(solicitante, { ...propria, status: S.CONCLUIDO })).toBe(false);
    });

    it('somente atendentes alteram status', () => {
      expect(podeAlterarStatus(atendente)).toBe(true);
      expect(podeAlterarStatus(solicitante)).toBe(false);
    });

    it('lista as transições disponíveis conforme perfil e status', () => {
      expect(transicoesPermitidas(atendente, propria)).toEqual([S.EM_ATENDIMENTO]);
      expect(transicoesPermitidas(atendente, { ...propria, status: S.EM_ATENDIMENTO })).toEqual([
        S.CONCLUIDO,
        S.ABERTO,
      ]);
      expect(transicoesPermitidas(atendente, { ...propria, status: S.CONCLUIDO })).toEqual([]);
      expect(transicoesPermitidas(solicitante, propria)).toEqual([]);
    });
  });

  describe('código da solicitação', () => {
    it('formata com prefixo e zeros à esquerda', () => {
      expect(formatarCodigo(42)).toBe('SOL-000042');
      expect(formatarCodigo(1234567)).toBe('SOL-1234567');
    });

    it.each([
      ['SOL-000042', 42],
      ['sol-42', 42],
      ['sol42', 42],
      [' 42 ', 42],
      ['notebook', null],
      ['SOL-', null],
    ])('extrai o id de "%s"', (termo, esperado) => {
      expect(extrairIdDoCodigo(termo)).toBe(esperado);
    });
  });
});
