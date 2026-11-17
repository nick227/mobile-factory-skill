// Typed HTTP client: timeouts, abort, bounded retries for idempotent reads,
// a single error type, and optional response parsing (e.g. a zod schema's .parse).
export type ApiErrorKind = 'network' | 'timeout' | 'aborted' | 'http' | 'parse' | 'validation';

export class ApiError extends Error {
  constructor(readonly kind: ApiErrorKind, message: string, readonly status?: number, readonly body?: unknown) {
    super(message);
    this.name = 'ApiError';
  }
  /** Safe to show to users; never includes response bodies. */
  get userMessage(): string {
    if (this.kind === 'network') return 'You appear to be offline. Check your connection and try again.';
    if (this.kind === 'timeout') return 'The server took too long to respond. Try again.';
    if (this.kind === 'http' && this.status === 404) return 'This item no longer exists.';
    if (this.kind === 'http' && this.status !== undefined && this.status >= 500) return 'The server had a problem. Try again shortly.';
    return 'Something went wrong. Try again.';
  }
}

export interface ApiRequest {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  path: string;
  query?: Record<string, string | number | boolean | undefined>;
  body?: unknown;
  headers: Record<string, string>;
  signal: AbortSignal;
}
export interface ApiResponse { status: number; body: unknown }
/** Anything that turns a request into a response: real fetch, or a mock. */
export type Transport = (req: ApiRequest) => Promise<ApiResponse>;

export function fetchTransport(baseUrl: string): Transport {
  return async (req) => {
    const url = new URL(req.path.replace(/^\//, ''), baseUrl.endsWith('/') ? baseUrl : baseUrl + '/');
    for (const [k, v] of Object.entries(req.query ?? {})) if (v !== undefined) url.searchParams.set(k, String(v));
    const res = await fetch(url.toString(), {
      method: req.method,
      headers: { Accept: 'application/json', ...(req.body !== undefined ? { 'Content-Type': 'application/json' } : {}), ...req.headers },
      body: req.body !== undefined ? JSON.stringify(req.body) : undefined,
      signal: req.signal,
    });
    const text = await res.text();
    let body: unknown = text;
    if (text && (res.headers.get('content-type') ?? '').includes('json')) {
      try { body = JSON.parse(text); } catch { throw new ApiError('parse', 'Response was not valid JSON', res.status); }
    }
    return { status: res.status, body };
  };
}

export interface ClientOptions {
  transport: Transport;
  timeoutMs?: number;
  /** Extra attempts for GET on network/timeout/5xx. */
  retries?: number;
  getToken?: () => string | null | Promise<string | null>;
  onUnauthorized?: () => void;
  sleep?: (ms: number) => Promise<void>;
}
export interface CallOptions<T> {
  query?: ApiRequest['query'];
  signal?: AbortSignal;
  /** Validate/transform the body, e.g. `EventSchema.parse`. Throwing yields ApiError('validation'). */
  parse?: (body: unknown) => T;
}

const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

export function createApiClient(options: ClientOptions) {
  const { transport, timeoutMs = 15000, retries = 2, getToken, onUnauthorized, sleep = wait } = options;

  async function once<T>(method: ApiRequest['method'], path: string, body: unknown, call: CallOptions<T>): Promise<T> {
    const controller = new AbortController();
    let timedOut = false;
    const timer = setTimeout(() => { timedOut = true; controller.abort(); }, timeoutMs);
    const onAbort = () => controller.abort();
    call.signal?.addEventListener('abort', onAbort);
    try {
      const token = getToken ? await getToken() : null;
      let res: ApiResponse;
      try {
        res = await transport({ method, path, query: call.query, body, headers: token ? { Authorization: `Bearer ${token}` } : {}, signal: controller.signal });
      } catch (err) {
        if (err instanceof ApiError) throw err;
        if (timedOut) throw new ApiError('timeout', `${method} ${path} timed out after ${timeoutMs} ms`);
        if (call.signal?.aborted) throw new ApiError('aborted', `${method} ${path} was cancelled`);
        throw new ApiError('network', `${method} ${path} failed: ${(err as Error)?.message ?? err}`);
      }
      if (res.status === 401) onUnauthorized?.();
      if (res.status < 200 || res.status >= 300) throw new ApiError('http', `${method} ${path} returned ${res.status}`, res.status, res.body);
      if (!call.parse) return res.body as T;
      try { return call.parse(res.body); } catch (err) { throw new ApiError('validation', `${method} ${path} returned unexpected data: ${(err as Error)?.message ?? err}`, res.status, res.body); }
    } finally {
      clearTimeout(timer);
      call.signal?.removeEventListener('abort', onAbort);
    }
  }

  async function request<T>(method: ApiRequest['method'], path: string, body: unknown, call: CallOptions<T> = {}): Promise<T> {
    const attempts = method === 'GET' ? retries + 1 : 1;
    for (let attempt = 1; ; attempt++) {
      try { return await once(method, path, body, call); } catch (err) {
        const e = err as ApiError;
        const transient = e.kind === 'network' || e.kind === 'timeout' || (e.kind === 'http' && (e.status ?? 0) >= 500);
        if (!transient || attempt >= attempts || call.signal?.aborted) throw e;
        await sleep(300 * 2 ** (attempt - 1));
      }
    }
  }

  return {
    get: <T>(path: string, call?: CallOptions<T>) => request<T>('GET', path, undefined, call),
    post: <T>(path: string, body?: unknown, call?: CallOptions<T>) => request<T>('POST', path, body, call),
    put: <T>(path: string, body?: unknown, call?: CallOptions<T>) => request<T>('PUT', path, body, call),
    patch: <T>(path: string, body?: unknown, call?: CallOptions<T>) => request<T>('PATCH', path, body, call),
    delete: <T>(path: string, call?: CallOptions<T>) => request<T>('DELETE', path, undefined, call),
  };
}
export type ApiClient = ReturnType<typeof createApiClient>;
