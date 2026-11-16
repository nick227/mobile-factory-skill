import React, { createContext, useContext } from 'react';
import { useColorScheme } from 'react-native';
import { tokens, type ColorMode } from './tokens';

const Override = createContext<ColorMode | null>(null);
export function ThemeProvider({ mode, children }: { mode: ColorMode | null; children: React.ReactNode }) {
  return <Override.Provider value={mode}>{children}</Override.Provider>;
}
export function useTheme() {
  const system = useColorScheme();
  const mode = useContext(Override) ?? (system === 'dark' ? 'dark' : 'light');
  return { mode, colors: tokens.colors[mode], tokens };
}
