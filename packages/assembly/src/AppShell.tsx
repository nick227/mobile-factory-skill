// Application shell shared by every page: global theme mode and a header-less router stack
// (each Monad page renders its own ScreenHeader, so pages look identical across platforms).
import React from 'react';
import { Stack as RouterStack } from 'expo-router';
import { ThemeProvider } from '@/src/ui';
import type { AppSpec } from './spec';

export function AppShell({ app }: { app: AppSpec }) {
  const mode = app.design?.colorMode === 'light' || app.design?.colorMode === 'dark' ? app.design.colorMode : null;
  return <ThemeProvider mode={mode}><RouterStack screenOptions={{ headerShown: false }} /></ThemeProvider>;
}
