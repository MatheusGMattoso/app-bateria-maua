// Helpers para consumir a API com segurança, evitando o erro técnico
// "JSON Parse error: Unexpected character: <" quando o backend está fora do ar
// ou devolve uma página HTML (404 do Express, por exemplo).

const MENSAGEM_SERVIDOR_INDISPONIVEL =
  'Servidor indisponível. Verifique se o backend está rodando e tente novamente.';

export class ApiError extends Error {
  status: number;

  constructor(message: string, status = 0) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

/**
 * Faz o parse seguro de uma resposta `fetch`, validando o `Content-Type`
 * antes de chamar `.json()`. Lança um `ApiError` com mensagem amigável
 * quando a resposta não é JSON ou quando o servidor retorna erro.
 */
export async function parseJsonResponse<T = any>(resposta: Response): Promise<T> {
  const contentType = resposta.headers.get('content-type') || '';

  if (!contentType.includes('application/json')) {
    throw new ApiError(MENSAGEM_SERVIDOR_INDISPONIVEL, resposta.status);
  }

  let dados: any;
  try {
    dados = await resposta.json();
  } catch {
    throw new ApiError(MENSAGEM_SERVIDOR_INDISPONIVEL, resposta.status);
  }

  if (!resposta.ok) {
    const mensagem = dados?.erro || dados?.message || 'Não foi possível concluir a operação.';
    throw new ApiError(mensagem, resposta.status);
  }

  return dados as T;
}

/**
 * Wrapper de `fetch` que já trata erros de rede e devolve o JSON validado.
 */
export async function fetchJson<T = any>(url: string, opcoes?: RequestInit): Promise<T> {
  let resposta: Response;
  try {
    resposta = await fetch(url, opcoes);
  } catch {
    throw new ApiError(MENSAGEM_SERVIDOR_INDISPONIVEL);
  }
  return parseJsonResponse<T>(resposta);
}
