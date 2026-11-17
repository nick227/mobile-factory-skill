// In-memory presentation store: seeded mock records plus local UI state. Not a data layer:
// nothing persists, nothing talks to a network. Latency and first-load failure are simulated
// so loading, error and retry states are real and demonstrable.
import { useSyncExternalStore } from 'react';
import type { AppSpec } from './spec';

export type Rec = Record<string, unknown> & { id: string };
type Status = 'idle' | 'loading' | 'ready' | 'error';

export function createStore(spec: Pick<AppSpec, 'data' | 'mock' | 'settings'>) {
  const listeners = new Set<() => void>();
  const data: Record<string, Rec[]> = {};
  for (const [name, rows] of Object.entries(spec.data)) data[name] = rows.map((r, i) => ({ ...r, id: String(r.id ?? `${name}-${i + 1}`) }));
  const status: Record<string, Status> = {};
  const failOnce = new Set(spec.mock?.failFirstLoad ?? []);
  const settings: Record<string, boolean> = { ...(spec.settings ?? {}) };
  const latency = spec.mock?.latencyMs ?? 300;
  // Shape of each collection (from its seed records), so new records get zero values for every field
  // and filters like { usedUp: false } match them.
  const zero = (v: unknown) => (typeof v === 'boolean' ? false : typeof v === 'number' ? 0 : Array.isArray(v) ? [] : typeof v === 'string' ? '' : null);
  const shape: Record<string, Record<string, unknown>> = {};
  for (const [name, rows] of Object.entries(data)) { shape[name] = {}; for (const r of rows) for (const [k, v] of Object.entries(r)) if (k !== 'id' && !(k in shape[name])) shape[name][k] = zero(v); }
  let version = 0;
  let seq = 0;
  const emit = () => { version++; listeners.forEach((l) => l()); };
  const ensure = (name: string) => {
    if (!(name in data)) throw Error(`Unknown collection ${name}`);
    data[name] = [...data[name]];
  };
  return {
    subscribe(l: () => void) { listeners.add(l); return () => { listeners.delete(l); }; },
    version: () => version,
    status: (name: string): Status => status[name] ?? 'idle',
    load(name: string) {
      if (status[name] === 'loading' || status[name] === 'ready') return;
      status[name] = 'loading'; emit();
      const settle = () => { if (failOnce.has(name)) { failOnce.delete(name); status[name] = 'error'; } else status[name] = 'ready'; emit(); };
      if (latency > 0) setTimeout(settle, latency); else settle();
    },
    retry(name: string) { status[name] = 'idle'; this.load(name); },
    list: (name: string): Rec[] => data[name] ?? [],
    get: (name: string, id: string): Rec | undefined => (data[name] ?? []).find((r) => r.id === id),
    create(name: string, values: Record<string, unknown>): Rec {
      ensure(name);
      const rec = { ...shape[name], ...values, id: `${name}-new-${++seq}` } as Rec;
      data[name] = [rec, ...data[name]]; emit(); return rec;
    },
    update(name: string, id: string, values: Record<string, unknown>) {
      ensure(name);
      data[name] = data[name].map((r) => (r.id === id ? { ...r, ...values, id } : r)); emit();
    },
    remove(name: string, id: string) { ensure(name); data[name] = data[name].filter((r) => r.id !== id); emit(); },
    setting: (key: string) => Boolean(settings[key]),
    setSetting(key: string, value: boolean) { settings[key] = value; emit(); },
  };
}
export type Store = ReturnType<typeof createStore>;

/** Re-render on any store change. */
export function useStore(store: Store) {
  useSyncExternalStore(store.subscribe, store.version, store.version);
  return store;
}
