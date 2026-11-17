// In-app mock backend for prototypes and demos: route table, simulated
// latency, and a switchable failure mode to exercise loading/error states.
import { ApiError, type ApiRequest, type Transport } from './client';

export type MockHandler = (req: ApiRequest, params: Record<string, string>) => unknown | Promise<unknown>;
export type FailureMode = 'never' | 'sometimes' | 'always';
export interface MockOptions { latencyMs?: [number, number]; failure?: FailureMode; failRate?: number; random?: () => number }

/** Throw from a handler to return an HTTP error, e.g. `throw mockError(404, 'Not found')`. */
export const mockError = (status: number, message: string) => new ApiError('http', message, status);

export function createMockTransport(routes: Record<string, MockHandler>, options: MockOptions = {}) {
  const random = options.random ?? Math.random;
  let failure: FailureMode = options.failure ?? 'never';
  const table = Object.entries(routes).map(([key, handler]) => {
    const [method, pattern] = key.split(' ');
    const names: string[] = [];
    const regex = new RegExp('^' + pattern.replace(/\/:([a-zA-Z]+)/g, (_, n) => { names.push(n); return '/([^/]+)'; }) + '/?$');
    return { method, regex, names, handler };
  });
  const transport: Transport = async (req) => {
    const [lo, hi] = options.latencyMs ?? [300, 800];
    await new Promise<void>((resolve, reject) => {
      const t = setTimeout(resolve, lo + random() * (hi - lo));
      req.signal.addEventListener('abort', () => { clearTimeout(t); reject(new Error('aborted')); });
    });
    if (failure === 'always' || (failure === 'sometimes' && random() < (options.failRate ?? 0.3))) throw new TypeError('Simulated network failure');
    for (const r of table) {
      const m = r.method === req.method ? req.path.match(r.regex) : null;
      if (!m) continue;
      const params = Object.fromEntries(r.names.map((n, i) => [n, decodeURIComponent(m[i + 1])]));
      try { return { status: req.method === 'POST' ? 201 : 200, body: structuredClone(await r.handler(req, params)) }; } catch (err) {
        if (err instanceof ApiError && err.status) return { status: err.status, body: { message: err.message } };
        throw err;
      }
    }
    return { status: 404, body: { message: `No mock route for ${req.method} ${req.path}` } };
  };
  return { transport, setFailure: (mode: FailureMode) => { failure = mode; }, getFailure: () => failure };
}
