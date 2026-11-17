// Copy to app/_layout.tsx when the blueprint requires accounts. Signed-out users
// only reach (auth) routes; signed-in users only reach (app) routes.
import React, { useMemo } from 'react';
import { Stack } from 'expo-router';
import { ThemeProvider, Screen, Spinner } from '@/src/ui';
import { AuthProvider, useAuth } from '@/src/foundations/auth/AuthProvider';
import { createMockAuthAdapter, type Session } from '@/src/foundations/auth/auth';
import { createStore } from '@/src/foundations/persistence/store';
import { secureBackend } from '@/src/foundations/persistence/device';

export { RouteErrorBoundary as ErrorBoundary } from '@/src/foundations/error-boundary/RouteErrorBoundary';

function Routes() {
  const auth = useAuth();
  if (auth.status === 'restoring') return <Screen style={{ justifyContent: 'center' }}><Spinner label="Loading" /></Screen>;
  return (
    <Stack screenOptions={{ headerBackButtonDisplayMode: 'minimal' }}>
      <Stack.Protected guard={auth.status === 'signed-in'}>
        <Stack.Screen name="(app)" options={{ headerShown: false }} />
      </Stack.Protected>
      <Stack.Protected guard={auth.status !== 'signed-in'}>
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  // Replace the mock adapter with a real provider adapter before release.
  const adapter = useMemo(() => {
    const store = createStore<Session | null>({ key: 'auth.session', version: 1, defaults: null, backend: secureBackend });
    return createMockAuthAdapter({ users: { 'demo@example.com': 'password' }, store: { load: store.load, save: store.save } });
  }, []);
  return (
    <ThemeProvider mode={null}>
      <AuthProvider adapter={adapter}><Routes /></AuthProvider>
    </ThemeProvider>
  );
}
