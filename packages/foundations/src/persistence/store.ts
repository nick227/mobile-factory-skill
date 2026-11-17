// Typed, versioned JSON storage over any async key-value backend.
// Corrupt or invalid data falls back to defaults instead of crashing the app.
export interface KeyValueBackend {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}

export interface StoreOptions<T> {
  key: string;
  version: number;
  defaults: T;
  backend: KeyValueBackend;
  /** Validate stored data, e.g. `Schema.parse`. Throwing resets to defaults. */
  validate?: (data: unknown) => T;
  /** Upgrade data written by an older version. */
  migrate?: (data: unknown, fromVersion: number) => unknown;
  onError?: (error: unknown) => void;
}

export interface Store<T> {
  load(): Promise<T>;
  save(value: T): Promise<void>;
  update(fn: (current: T) => T): Promise<T>;
  clear(): Promise<void>;
  subscribe(listener: (value: T) => void): () => void;
}

export function createStore<T>(o: StoreOptions<T>): Store<T> {
  const listeners = new Set<(value: T) => void>();
  let queue: Promise<unknown> = Promise.resolve();
  // Serialize writes so concurrent updates never lose data.
  const serial = <R>(fn: () => Promise<R>) => { const next = queue.then(fn, fn); queue = next.catch(() => undefined); return next; };
  const fallback = (err: unknown) => { o.onError?.(err); return structuredClone(o.defaults); };

  async function load(): Promise<T> {
    let raw: string | null;
    try { raw = await o.backend.getItem(o.key); } catch (err) { return fallback(err); }
    if (raw === null) return structuredClone(o.defaults);
    try {
      const parsed = JSON.parse(raw) as { v?: number; data?: unknown };
      let data = parsed.data;
      const from = typeof parsed.v === 'number' ? parsed.v : 0;
      if (from > o.version) throw new Error(`${o.key} was written by a newer app version (${from} > ${o.version})`);
      if (from < o.version) {
        if (!o.migrate) throw new Error(`${o.key} needs a migration from version ${from}`);
        data = o.migrate(data, from);
      }
      return o.validate ? o.validate(data) : (data as T);
    } catch (err) { return fallback(err); }
  }
  async function write(value: T) {
    await o.backend.setItem(o.key, JSON.stringify({ v: o.version, data: value }));
    for (const l of listeners) l(value);
  }
  return {
    load,
    save: (value) => serial(() => write(value)),
    update: (fn) => serial(async () => { const next = fn(await load()); await write(next); return next; }),
    clear: () => serial(async () => { await o.backend.removeItem(o.key); for (const l of listeners) l(structuredClone(o.defaults)); }),
    subscribe: (listener) => { listeners.add(listener); return () => listeners.delete(listener); },
  };
}

/** In-memory backend for tests and web previews. */
export function memoryBackend(seed: Record<string, string> = {}): KeyValueBackend & { dump(): Record<string, string> } {
  const data = new Map(Object.entries(seed));
  return {
    getItem: async (k) => data.get(k) ?? null,
    setItem: async (k, v) => { data.set(k, v); },
    removeItem: async (k) => { data.delete(k); },
    dump: () => Object.fromEntries(data),
  };
}
