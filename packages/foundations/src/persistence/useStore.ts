import { useCallback, useEffect, useState } from 'react';
import type { Store } from './store';

/** Read a store in a component. `value` is undefined until the first load finishes. */
export function useStore<T>(store: Store<T>) {
  const [value, setValue] = useState<T | undefined>(undefined);
  useEffect(() => {
    let alive = true;
    store.load().then((v) => { if (alive) setValue(v); });
    const off = store.subscribe((v) => { if (alive) setValue(v); });
    return () => { alive = false; off(); };
  }, [store]);
  const update = useCallback((fn: (current: T) => T) => store.update(fn), [store]);
  return { value, ready: value !== undefined, update };
}
