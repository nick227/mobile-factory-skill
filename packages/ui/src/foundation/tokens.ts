export const tokens = {
  spacing: { none: 0, xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 },
  radius: { none: 0, sm: 6, md: 12, lg: 18, full: 999 },
  typography: { display: 32, title: 24, heading: 18, body: 16, small: 13, caption: 11 },
  colors: {
    light: {
      background: '#FFFFFF',
      surface: '#F5F6F7',
      surfaceSubtle: '#FAFAFA',
      text: '#16181C',
      muted: '#646A72',
      border: '#DEE1E5',
      primary: '#1D4ED8',
      onPrimary: '#FFFFFF',
      danger: '#B42318',
      success: '#027A48',
      warning: '#B54708',
    },
    dark: {
      background: '#101114',
      surface: '#1C1F23',
      surfaceSubtle: '#16181B',
      text: '#F5F6F8',
      muted: '#B3B8C0',
      border: '#353940',
      primary: '#8FB2FF',
      onPrimary: '#101114',
      danger: '#FF8F89',
      success: '#32D583',
      warning: '#FDB022',
    },
  },
} as const;
export type ColorMode = keyof typeof tokens.colors;
export type Palette = typeof tokens.colors.light | typeof tokens.colors.dark;

// Experience geometry: stable platform-neutral logical units.
export const geometry = {
  screenGutter: 20, sectionGap: 24, controlGap: 8,
  buttonHeight: 52, inputHeight: 52, listRowMinHeight: 60, iconTouchTarget: 48,
  touchTargets: { ios: 44, android: 48 },
  icons: { sm: 16, md: 20, lg: 24 },
  mediaRatios: { square: 1, portrait: 3 / 4, landscape: 4 / 3, wide: 16 / 9 },
} as const;
export const motion = { press: 'immediate', reveal: 'restrained', navigation: 'native', reducedMotion: 'respect-system' } as const;
