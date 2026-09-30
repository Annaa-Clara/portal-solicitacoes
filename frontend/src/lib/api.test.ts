import { afterEach, describe, expect, it, vi } from 'vitest';
import { api, ApiError } from './api';

function resposta(status: number, corpo?: unknown) {
  return new Response(corpo === undefined ? null : JSON.stringify(corpo), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('cliente da API', () => {
  afterEach(() => vi.restoreAllMocks());

  it('envia o cookie da sessão, serializa o corpo e omite parâmetros vazios', async () => {
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockImplementation(() => Promise.resolve(resposta(200, { ok: true })));

    await api.get('/solicitacoes', { status: 'ABERTO', texto: '', categoriaId: undefined, pagina: 2 });
    await api.post('/solicitacoes', { titulo: 'x' });

    expect(fetchMock.mock.calls[0][0]).toBe('/api/solicitacoes?status=ABERTO&pagina=2');
    const [, opcoesPost] = fetchMock.mock.calls[1];
    expect(opcoesPost?.credentials).toBe('same-origin');
    expect(opcoesPost?.body).toBe('{"titulo":"x"}');
  });

  it('converte Problem Details em ApiError com erros por campo', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      resposta(400, {
        title: 'Requisição inválida',
        status: 400,
        detail: 'Um ou mais campos são inválidos.',
        requestId: 'abc-123',
        erros: [{ campo: 'titulo', mensagem: 'Informe o título.' }],
      }),
    );

    const erro = await api.post('/solicitacoes', {}).catch((e: unknown) => e);

    expect(erro).toBeInstanceOf(ApiError);
    expect((erro as ApiError).status).toBe(400);
    expect((erro as ApiError).requestId).toBe('abc-123');
    expect((erro as ApiError).erroDoCampo('titulo')).toBe('Informe o título.');
  });

  it('trata respostas 204 sem corpo', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(null, { status: 204 }));
    await expect(api.delete('/solicitacoes/1')).resolves.toBeUndefined();
  });

  it('gera mensagem amigável quando o servidor está fora do ar', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new TypeError('Failed to fetch'));
    await expect(api.get('/dashboard')).rejects.toMatchObject({ status: 0 });

    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('<html>502</html>', { status: 502 }));
    await expect(api.get('/dashboard')).rejects.toThrow(/indisponível/);
  });
});
