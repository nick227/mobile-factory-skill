// Copy to app/_layout.tsx. One root Stack; content opens content; native back
// always works. Add (tabs) only for 3+ persistent peer areas (see README).
import React from 'react';
import { Stack } from 'expo-router';
import { ThemeProvider, useTheme } from '@/src/ui';

// Every route gets recovery UI instead of a crash.
export { RouteErrorBoundary as ErrorBoundary } from '@/src/foundations/error-boundary/RouteErrorBoundary';

/** Native header and screen background follow the factory theme (light/dark). */
export function useStackTheme() {
  const { colors } = useTheme();
  return {
    headerBackButtonDisplayMode: 'minimal' as const,
    headerStyle: { backgroundColor: colors.background },
    headerTintColor: colors.text,
    headerShadowVisible: false,
    contentStyle: { backgroundColor: colors.background },
  };
}

function ThemedStack() {
  return <Stack screenOptions={useStackTheme()} />;
}

export default function RootLayout() {
  return (
    <ThemeProvider mode={null}>
      <ThemedStack />
    </ThemeProvider>
  );
}
