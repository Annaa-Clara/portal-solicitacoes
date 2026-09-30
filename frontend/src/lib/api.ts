import type { ErroCampo, ProblemDetails } from '@/types/api';

/** Erro de API com os dados do Problem Details retornado pelo backend. */
export class ApiError extends Error {
  readonly status: number;
  readonly erros: ErroCampo[];
  readonly requestId?: string;

  constructor(problema: ProblemDetails) {
    super(problema.detail);
    this.name = 'ApiError';
    this.status = problema.status;
    this.erros = problema.erros ?? [];
    this.requestId = problema.requestId;
  }

  /** Mensagem do primeiro erro de um campo específico, se houver. */
  erroDoCampo(campo: string): string | undefined {
    return this.erros.find((e) => e.campo === campo)?.mensagem;
  }
}

type Metodo = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
type Parametros = Record<string, string | number | undefined | null>;

const BASE = '/api';

function montarUrl(caminho: string, params?: Parametros): string {
  const busca = new URLSearchParams();
  for (const [chave, valor] of Object.entries(params ?? {})) {
    if (valor !== undefined && valor !== null && valor !== '') busca.set(chave, String(valor));
  }
  const qs = busca.toString();
  return `${BASE}${caminho}${qs ? `?${qs}` : ''}`;
}

async function lerErro(resposta: Response): Promise<ApiError> {
  try {
    const corpo = (await resposta.json()) as Partial<ProblemDetails>;
    if (corpo && typeof corpo.detail === 'string') {
      return new ApiError({
        title: corpo.title ?? 'Erro',
        status: resposta.status,
        detail: corpo.detail,
        erros: corpo.erros,
        requestId: corpo.requestId,
      });
    }
  } catch {
    /* corpo não é JSON (ex.: proxy fora do ar) */
  }
  const detail =
    resposta.status >= 500
      ? 'O servidor está indisponível no momento. Tente novamente em instantes.'
      : `Falha na requisição (HTTP ${resposta.status}).`;
  return new ApiError({ title: 'Erro', status: resposta.status, detail });
}

export async function requisicao<T>(
  metodo: Metodo,
  caminho: string,
  opcoes: { corpo?: unknown; params?: Parametros; signal?: AbortSignal } = {},
): Promise<T> {
  let resposta: Response;
  try {
    resposta = await fetch(montarUrl(caminho, opcoes.params), {
      method: metodo,
      credentials: 'same-origin', // cookie de sessão HttpOnly
      headers: {
        Accept: 'application/json',
        ...(opcoes.corpo !== undefined ? { 'Content-Type': 'application/json' } : {}),
      },
      body: opcoes.corpo !== undefined ? JSON.stringify(opcoes.corpo) : undefined,
      signal: opcoes.signal,
    });
  } catch (erro) {
    if ((erro as Error).name === 'AbortError') throw erro;
    throw new ApiError({
      title: 'Sem conexão',
      status: 0,
      detail: 'Não foi possível conectar ao servidor. Verifique sua conexão.',
    });
  }

  if (!resposta.ok) throw await lerErro(resposta);
  if (resposta.status === 204) return undefined as T;
  return (await resposta.json()) as T;
}

export const api = {
  get: <T>(caminho: string, params?: Parametros, signal?: AbortSignal) =>
    requisicao<T>('GET', caminho, { params, signal }),
  post: <T>(caminho: string, corpo?: unknown) => requisicao<T>('POST', caminho, { corpo }),
  put: <T>(caminho: string, corpo: unknown) => requisicao<T>('PUT', caminho, { corpo }),
  patch: <T>(caminho: string, corpo: unknown) => requisicao<T>('PATCH', caminho, { corpo }),
  delete: <T = void>(caminho: string) => requisicao<T>('DELETE', caminho),
};
