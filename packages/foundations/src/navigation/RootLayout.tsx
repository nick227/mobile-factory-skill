// Copy to app/_layout.tsx. One root Stack; content opens content; native back
// always works. Add (tabs) only for 3+ persistent peer areas (see README).
import React from 'react';
import { Stack } from 'expo-router';
import { ThemeProvider } from '@/src/ui';

// Every route gets recovery UI instead of a crash.
export { RouteErrorBoundary as ErrorBoundary } from '@/src/foundations/error-boundary/RouteErrorBoundary';

export default function RootLayout() {
  return (
    <ThemeProvider mode={null}>
      <Stack screenOptions={{ headerBackButtonDisplayMode: 'minimal' }} />
    </ThemeProvider>
  );
}
