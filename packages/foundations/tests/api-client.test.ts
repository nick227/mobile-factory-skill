import test from 'node:test';
import assert from 'node:assert/strict';
import { ApiError, createApiClient, type ApiRequest, type Transport } from '../src/api-client/client';
import { createMockTransport, mockError } from '../src/api-client/mock';
import { resourceReducer, type Resource } from '../src/api-client/resource';

const noSleep = async () => {};
const ok = (body: unknown): Transport => async () => ({ status: 200, body });

test('GET retries transient failures with backoff, then succeeds', async () => {
  let calls = 0; const waits: number[] = [];
  const client = createApiClient({ transport: async () => { calls++; if (calls < 3) throw new TypeError('offline'); return { status: 200, body: 'ok' }; }, sleep: async (ms) => { waits.push(ms); } });
  assert.equal(await client.get('/x'), 'ok');
  assert.equal(calls, 3);
  assert.deepEqual(waits, [300, 600]);
});

test('writes are never retried automatically', async () => {
  let calls = 0;
  const client = createApiClient({ transport: async () => { calls++; throw new TypeError('offline'); }, sleep: noSleep });
  await assert.rejects(client.post('/x', {}), (e: ApiError) => e.kind === 'network');
  assert.equal(calls, 1);
});

test('4xx is not retried and maps to a user-safe message', async () => {
  let calls = 0;
  const client = createApiClient({ transport: async () => { calls++; return { status: 404, body: { secret: 'internal' } }; }, sleep: noSleep });
  await assert.rejects(client.get('/x'), (e: ApiError) => e.kind === 'http' && e.status === 404 && !e.userMessage.includes('internal'));
  assert.equal(calls, 1);
});

test('timeouts abort the request and are reported as timeout', async () => {
  const client = createApiClient({ timeoutMs: 20, retries: 0, transport: (req: ApiRequest) => new Promise((_, reject) => req.signal.addEventListener('abort', () => reject(new Error('aborted')))) });
  await assert.rejects(client.get('/slow'), (e: ApiError) => e.kind === 'timeout');
});

test('caller cancellation is reported as aborted and not retried', async () => {
  const controller = new AbortController(); let calls = 0;
  const client = createApiClient({ sleep: noSleep, transport: (req) => { calls++; return new Promise((_, reject) => req.signal.addEventListener('abort', () => reject(new Error('x')))); } });
  const p = client.get('/x', { signal: controller.signal });
  controller.abort();
  await assert.rejects(p, (e: ApiError) => e.kind === 'aborted');
  assert.equal(calls, 1);
});

test('parse failures become validation errors; token header and 401 hook work', async () => {
  let seen: Record<string, string> = {}; let unauthorized = 0;
  const client = createApiClient({ getToken: () => 't0k', onUnauthorized: () => { unauthorized++; }, transport: async (req) => { seen = req.headers; return req.path === '/me' ? { status: 401, body: null } : { status: 200, body: { n: 'x' } }; } });
  await assert.rejects(client.get('/n', { parse: (b) => { if (typeof (b as { n: unknown }).n !== 'number') throw new Error('n must be a number'); return b; } }), (e: ApiError) => e.kind === 'validation');
  assert.equal(seen.Authorization, 'Bearer t0k');
  await assert.rejects(client.get('/me'));
  assert.equal(unauthorized, 1);
  assert.deepEqual(await createApiClient({ transport: ok([1]) }).get('/'), [1]);
});

test('mock transport routes params, returns copies, supports failure modes and HTTP errors', async () => {
  const events = [{ id: 'a', title: 'A' }];
  const mock = createMockTransport({
    'GET /events': () => events,
    'GET /events/:id': (_req, { id }) => { const e = events.find((x) => x.id === id); if (!e) throw mockError(404, 'Event not found'); return e; },
    'POST /events': (req) => { events.push(req.body as { id: string; title: string }); return req.body; },
  }, { latencyMs: [0, 0] });
  const client = createApiClient({ transport: mock.transport, sleep: noSleep });
  const list = await client.get<typeof events>('/events');
  list[0].title = 'mutated';
  assert.equal(events[0].title, 'A', 'handlers return copies');
  assert.equal((await client.get<{ id: string }>('/events/a')).id, 'a');
  await assert.rejects(client.get('/events/zzz'), (e: ApiError) => e.status === 404);
  assert.equal((await client.post<{ id: string }>('/events', { id: 'b', title: 'B' })).id, 'b');
  mock.setFailure('always');
  await assert.rejects(client.get('/events'), (e: ApiError) => e.kind === 'network');
  mock.setFailure('never');
  await assert.rejects(client.get('/nope'), (e: ApiError) => e.status === 404);
});

test('resource state keeps previous data during refresh and after a failed refresh', () => {
  const err = new ApiError('network', 'x');
  let s: Resource<number> = { status: 'loading' };
  s = resourceReducer(s, { type: 'start' });
  assert.equal(s.status, 'loading');
  s = resourceReducer(s, { type: 'success', data: 1 });
  s = resourceReducer(s, { type: 'start' });
  assert.deepEqual(s, { status: 'ready', data: 1, refreshing: true, error: undefined });
  s = resourceReducer(s, { type: 'failure', error: err });
  assert.equal(s.status, 'ready', 'failed refresh never blanks the screen');
  assert.equal(s.status === 'ready' && s.data, 1);
  assert.equal(resourceReducer<number>({ status: 'loading' }, { type: 'failure', error: err }).status, 'error');
});
