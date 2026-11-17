// Session state for the whole app. Guard routes with expo-router:
//   <Stack.Protected guard={auth.status === 'signed-in'}> … </Stack.Protected>
import React, { createContext, useCallback, useContext, useEffect, useMemo, useReducer } from 'react';
import { AuthError, authReducer, type AuthAdapter, type AuthState } from './auth';
import { reportError } from '../error-boundary/report';

type AuthContextValue = AuthState & { signIn(credentials: Record<string, string>): Promise<boolean>; signOut(): Promise<void> };
const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ adapter, children }: { adapter: AuthAdapter; children: React.ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, { status: 'restoring' });
  useEffect(() => {
    adapter.restore().then((session) => dispatch({ type: 'restored', session }), (err) => { reportError(err, { during: 'auth restore' }); dispatch({ type: 'restored', session: null }); });
  }, [adapter]);
  const signIn = useCallback(async (credentials: Record<string, string>) => {
    dispatch({ type: 'sign-in-start' });
    try { dispatch({ type: 'signed-in', session: await adapter.signIn(credentials) }); return true; } catch (err) {
      if (!(err instanceof AuthError)) reportError(err, { during: 'sign in' });
      dispatch({ type: 'sign-in-failed', error: err instanceof AuthError ? err.message : 'Sign-in failed. Try again.' });
      return false;
    }
  }, [adapter]);
  const signOut = useCallback(async () => {
    if (state.status === 'signed-in') { try { await adapter.signOut(state.session); } catch (err) { reportError(err, { during: 'sign out' }); } }
    dispatch({ type: 'signed-out' });
  }, [adapter, state]);
  const value = useMemo(() => ({ ...state, signIn, signOut }), [state, signIn, signOut]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
