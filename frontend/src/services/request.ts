const API_BASE_URL = normalizeBaseUrl(import.meta.env.VITE_API_BASE_URL);

export class RequestError extends Error {
  readonly status: number;
  readonly data: unknown;

  constructor(message: string, status: number, data: unknown = null) {
    super(message);
    this.name = 'RequestError';
    this.status = status;
    this.data = data;
  }
}

type RequestBody = BodyInit | object | null;

interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: RequestBody;
}

function normalizeBaseUrl(baseUrl: string | undefined) {
  return baseUrl?.trim().replace(/\/+$/, '') ?? '';
}

export function buildApiUrl(path: string) {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
}

function isBodyInit(body: RequestBody): body is BodyInit {
  return (
    typeof body === 'string' ||
    body instanceof Blob ||
    body instanceof FormData ||
    body instanceof URLSearchParams ||
    body instanceof ArrayBuffer ||
    ArrayBuffer.isView(body)
  );
}

function buildRequestBody(body: RequestBody | undefined, headers: Headers) {
  if (body === undefined) {
    return undefined;
  }

  if (isBodyInit(body)) {
    return body;
  }

  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  return JSON.stringify(body);
}

async function parseResponse(response: Response): Promise<unknown> {
  if (response.status === 204) {
    return null;
  }

  const contentType = response.headers.get('Content-Type') ?? '';
  if (contentType.includes('application/json')) {
    return response.json();
  }

  return response.text();
}

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers = new Headers(options.headers);
  const body = buildRequestBody(options.body, headers);

  let response: Response;

  try {
    response = await fetch(buildApiUrl(path), {
      ...options,
      headers,
      body,
    });
  } catch {
    throw new RequestError('Network request failed', 0);
  }

  const data = await parseResponse(response).catch(() => null);

  if (!response.ok) {
    throw new RequestError(response.statusText || 'Request failed', response.status, data);
  }

  return data as T;
}
