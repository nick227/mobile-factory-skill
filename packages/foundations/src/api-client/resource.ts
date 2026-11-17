// Screen data state. Keeps the previous data visible while refreshing (no
// empty-to-loaded flashes), ignores stale responses, and aborts on unmount.
import { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import { ApiError } from './client';

export type Resource<T> =
  | { status: 'loading' }
  | { status: 'error'; error: ApiError; data?: T }
  | { status: 'ready'; data: T; refreshing: boolean; error?: ApiError };

type Action<T> = { type: 'start' } | { type: 'success'; data: T } | { type: 'failure'; error: ApiError };

export function resourceReducer<T>(state: Resource<T>, action: Action<T>): Resource<T> {
  switch (action.type) {
    case 'start':
      return state.status === 'ready' ? { ...state, refreshing: true, error: undefined } : state.status === 'error' && state.data !== undefined ? { status: 'ready', data: state.data, refreshing: true } : { status: 'loading' };
    case 'success':
      return { status: 'ready', data: action.data, refreshing: false };
    case 'failure':
      // A failed background refresh keeps showing the last good data.
      return state.status === 'ready' ? { ...state, refreshing: false, error: action.error } : { status: 'error', error: action.error };
  }
}

export const toApiError = (err: unknown): ApiError => (err instanceof ApiError ? err : new ApiError('network', (err as Error)?.message ?? String(err)));

/** Load data for a screen. `load` receives an AbortSignal; pass it to the client. */
export function useResource<T>(load: (signal: AbortSignal) => Promise<T>, deps: readonly unknown[]): Resource<T> & { reload: () => void } {
  const [state, dispatch] = useReducer(resourceReducer<T>, { status: 'loading' } as Resource<T>);
  const [tick, setTick] = useState(0);
  const loadRef = useRef(load);
  loadRef.current = load;
  useEffect(() => {
    const controller = new AbortController();
    dispatch({ type: 'start' });
    loadRef.current(controller.signal).then(
      (data) => { if (!controller.signal.aborted) dispatch({ type: 'success', data }); },
      (err) => { if (!controller.signal.aborted) dispatch({ type: 'failure', error: toApiError(err) }); },
    );
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick]);
  const reload = useCallback(() => setTick((n) => n + 1), []);
  return { ...state, reload };
}

/** Run a write. Caller decides what to do on success; `pending` drives Button loading. */
export function useMutation<A, R>(run: (input: A) => Promise<R>) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const busy = useRef(false);
  const mutate = useCallback(async (input: A): Promise<R | undefined> => {
    if (busy.current) return undefined; // ignore rapid repeat taps
    busy.current = true; setPending(true); setError(null);
    try { return await run(input); } catch (err) { setError(toApiError(err)); return undefined; } finally { busy.current = false; setPending(false); }
  }, [run]);
  return { mutate, pending, error, reset: () => setError(null) };
}
