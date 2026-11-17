// Application shell shared by every page: global theme mode, multi-axis design config,
// and a header-less router stack (each Monad page renders its own ScreenHeader, so pages
// look identical across platforms).
import React from 'react';
import { Stack as RouterStack } from 'expo-router';
import { ThemeProvider } from '@/src/ui';
import type { AppSpec } from './spec';

export function AppShell({ app }: { app: AppSpec }) {
  const d = app.design;
  const mode = d?.colorMode === 'light' || d?.colorMode === 'dark' ? d.colorMode : null;
  return (
    <ThemeProvider
      mode={mode}
      preset={d?.preset}
      palette={d?.palette}
      radius={d?.radius}
      density={d?.density}
      typography={d?.typography}
      surface={d?.surface}
      layout={d?.layout}
      media={d?.media}
    >
      <RouterStack screenOptions={{ headerShown: false }} />
    </ThemeProvider>
  );
}
