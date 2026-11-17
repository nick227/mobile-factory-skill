import test from 'node:test';
import assert from 'node:assert/strict';
import { createStore, memoryBackend } from '../src/persistence/store';

type Rsvps = Record<string, boolean>;
const validate = (d: unknown): Rsvps => { if (!d || typeof d !== 'object' || Array.isArray(d)) throw new Error('bad shape'); return d as Rsvps; };

test('round-trips typed data and survives a new store instance (app restart)', async () => {
  const backend = memoryBackend();
  const a = createStore<Rsvps>({ key: 'rsvps', version: 1, defaults: {}, backend, validate });
  await a.update((r) => ({ ...r, e1: true }));
  const b = createStore<Rsvps>({ key: 'rsvps', version: 1, defaults: {}, backend, validate });
  assert.deepEqual(await b.load(), { e1: true });
});

test('corrupt or invalid data falls back to defaults and reports the error', async () => {
  const errors: unknown[] = [];
  const store = createStore<Rsvps>({ key: 'k', version: 1, defaults: {}, backend: memoryBackend({ k: '{not json' }), validate, onError: (e) => errors.push(e) });
  assert.deepEqual(await store.load(), {});
  const store2 = createStore<Rsvps>({ key: 'k', version: 1, defaults: {}, backend: memoryBackend({ k: JSON.stringify({ v: 1, data: [1] }) }), validate, onError: (e) => errors.push(e) });
  assert.deepEqual(await store2.load(), {});
  assert.equal(errors.length, 2);
});

test('migrates older versions and refuses data from newer versions', async () => {
  const backend = memoryBackend({ k: JSON.stringify({ v: 1, data: ['e1', 'e2'] }) });
  const v2 = createStore<Rsvps>({ key: 'k', version: 2, defaults: {}, backend, validate, migrate: (d, from) => (from === 1 ? Object.fromEntries((d as string[]).map((id) => [id, true])) : d) });
  assert.deepEqual(await v2.load(), { e1: true, e2: true });
  const errors: unknown[] = [];
  const old = createStore<Rsvps>({ key: 'k', version: 1, defaults: {}, backend: memoryBackend({ k: JSON.stringify({ v: 3, data: {} }) }), onError: (e) => errors.push(e) });
  assert.deepEqual(await old.load(), {});
  assert.match(String(errors[0]), /newer app version/);
});

test('concurrent updates are serialized and none are lost', async () => {
  const store = createStore<number>({ key: 'n', version: 1, defaults: 0, backend: memoryBackend() });
  await Promise.all(Array.from({ length: 20 }, () => store.update((n) => n + 1)));
  assert.equal(await store.load(), 20);
});

test('subscribers see saves and clears; defaults are not shared mutable objects', async () => {
  const store = createStore<Rsvps>({ key: 's', version: 1, defaults: {}, backend: memoryBackend() });
  const seen: Rsvps[] = [];
  const off = store.subscribe((v) => seen.push(v));
  await store.save({ a: true });
  await store.clear();
  off();
  await store.save({ b: true });
  assert.deepEqual(seen, [{ a: true }, {}]);
  const d1 = await createStore<Rsvps>({ key: 'z', version: 1, defaults: {}, backend: memoryBackend() }).load();
  d1.x = true;
  assert.deepEqual(await createStore<Rsvps>({ key: 'z', version: 1, defaults: {}, backend: memoryBackend() }).load(), {});
});
