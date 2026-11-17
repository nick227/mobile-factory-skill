// Route-level recovery for Expo Router. In any route file (or app/_layout.tsx for all routes):
//   export { RouteErrorBoundary as ErrorBoundary } from '@/src/foundations/error-boundary/RouteErrorBoundary';
import React, { useEffect } from 'react';
import type { ErrorBoundaryProps } from 'expo-router';
import { Screen, EmptyState, Button } from '@/src/ui';
import { reportError } from './report';

export function RouteErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  useEffect(() => { reportError(error, { boundary: 'route' }); }, [error]);
  return (
    <Screen style={{ justifyContent: 'center' }}>
      <EmptyState
        title="This screen hit a problem"
        description="Your data is safe. Try again, or go back and reopen it."
        action={<Button label="Try again" onPress={() => { void retry(); }} accessibilityHint="Reloads this screen" />}
      />
    </Screen>
  );
}
