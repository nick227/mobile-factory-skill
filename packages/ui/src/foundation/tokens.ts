// Multi-Axis Design Token Matrix

export type ColorMode = 'light' | 'dark';
export type PaletteName = 'default' | 'kyoto' | 'midnight' | 'emerald' | 'crimson' | 'amber';
export type RadiusScaleName = 'sharp' | 'smooth' | 'curved';
export type DensityScaleName = 'compact' | 'comfortable' | 'spacious';
export type TypographyScaleName = 'compact' | 'default' | 'editorial';
export type SurfaceStyleName = 'flat' | 'elevated' | 'outlined';
export type LayoutAxisName = 'standard' | 'editorial' | 'immersive';
export type MediaTreatmentName = 'contained' | 'edge-to-edge' | 'mosaic';

export type PresetThemeName =
  | 'minimal-pro'
  | 'kyoto-craft'
  | 'fintech-midnight'
  | 'wellness-botanical'
  | 'editorial-luxury'
  | 'playful-consumer';

export interface ThemePaletteColors {
  background: string;
  surface: string;
  surfaceSubtle: string;
  text: string;
  muted: string;
  border: string;
  primary: string;
  onPrimary: string;
  danger: string;
  success: string;
  warning: string;
}

export type Palette = ThemePaletteColors;

export interface PalettePair {
  light: ThemePaletteColors;
  dark: ThemePaletteColors;
}

export const palettes: Record<PaletteName, PalettePair> = {
  // 1. Default / Slate: Neutral, crisp, high-contrast modern native (Linear / Apple style)
  default: {
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

  // 2. Kyoto: Warm cedar, sumi charcoal, sand stone, terracotta accent (Craft & Heritage)
  kyoto: {
    light: {
      background: '#FAF8F5',
      surface: '#F2EFE9',
      surfaceSubtle: '#F8F6F2',
      text: '#241E19',
      muted: '#786F66',
      border: '#E3DDD3',
      primary: '#B84A28',
      onPrimary: '#FFFFFF',
      danger: '#C53030',
      success: '#2F855A',
      warning: '#C05621',
    },
    dark: {
      background: '#181512',
      surface: '#24201B',
      surfaceSubtle: '#1D1915',
      text: '#F5F0EB',
      muted: '#ABA094',
      border: '#3D362E',
      primary: '#F07A54',
      onPrimary: '#181512',
      danger: '#FC8181',
      success: '#48BB78',
      warning: '#F6AD55',
    },
  },

  // 3. Midnight: Deep obsidian, carbon, electric cyan neon (FinTech, Web3 & Cyberpunk)
  midnight: {
    light: {
      background: '#F8FAFC',
      surface: '#F1F5F9',
      surfaceSubtle: '#F8FAFC',
      text: '#0F172A',
      muted: '#64748B',
      border: '#E2E8F0',
      primary: '#0284C7',
      onPrimary: '#FFFFFF',
      danger: '#E11D48',
      success: '#10B981',
      warning: '#D97706',
    },
    dark: {
      background: '#090D16',
      surface: '#131B2E',
      surfaceSubtle: '#0D1424',
      text: '#F1F5F9',
      muted: '#94A3B8',
      border: '#22314E',
      primary: '#38BDF8',
      onPrimary: '#090D16',
      danger: '#FB7185',
      success: '#34D399',
      warning: '#FBBF24',
    },
  },

  // 4. Emerald: Botanical pine, sage, eucalyptus, calm leaf tones (Health & Wellness)
  emerald: {
    light: {
      background: '#F7FAF8',
      surface: '#EEF4F0',
      surfaceSubtle: '#F3F7F5',
      text: '#14231B',
      muted: '#5E7166',
      border: '#D7E3DC',
      primary: '#15803D',
      onPrimary: '#FFFFFF',
      danger: '#B91C1C',
      success: '#16A34A',
      warning: '#B45309',
    },
    dark: {
      background: '#0D1711',
      surface: '#16251C',
      surfaceSubtle: '#111E16',
      text: '#EEF6F1',
      muted: '#9AB0A2',
      border: '#263D2F',
      primary: '#4ADE80',
      onPrimary: '#0D1711',
      danger: '#F87171',
      success: '#4ADE80',
      warning: '#FBBF24',
    },
  },

  // 5. Crimson: Bordeaux velvet, champagne cream, warm rose (Luxury & Editorial)
  crimson: {
    light: {
      background: '#FCF9F9',
      surface: '#F8EFEF',
      surfaceSubtle: '#FAF4F4',
      text: '#261316',
      muted: '#7D6569',
      border: '#E8D5D8',
      primary: '#BE123C',
      onPrimary: '#FFFFFF',
      danger: '#E11D48',
      success: '#059669',
      warning: '#D97706',
    },
    dark: {
      background: '#170A0D',
      surface: '#261318',
      surfaceSubtle: '#1E0E12',
      text: '#FDF2F4',
      muted: '#BA9DA3',
      border: '#42232B',
      primary: '#FB7185',
      onPrimary: '#170A0D',
      danger: '#FDA4AF',
      success: '#34D399',
      warning: '#FBBF24',
    },
  },

  // 6. Amber: Warm honey, golden ochre, coffee (Travel, Food & Playful Consumer)
  amber: {
    light: {
      background: '#FDFBF7',
      surface: '#F7F2E8',
      surfaceSubtle: '#FAF6EE',
      text: '#2B2113',
      muted: '#7A6F5E',
      border: '#E7DFC9',
      primary: '#D97706',
      onPrimary: '#FFFFFF',
      danger: '#B91C1C',
      success: '#15803D',
      warning: '#D97706',
    },
    dark: {
      background: '#16130B',
      surface: '#241E12',
      surfaceSubtle: '#1C170E',
      text: '#FBF6EA',
      muted: '#ABA08C',
      border: '#3E3420',
      primary: '#FBBF24',
      onPrimary: '#16130B',
      danger: '#F87171',
      success: '#4ADE80',
      warning: '#FBBF24',
    },
  },
};

// Radius Scale Axis
export const radiusScales = {
  sharp: { none: 0, sm: 2, md: 4, lg: 6, full: 999 },
  smooth: { none: 0, sm: 6, md: 12, lg: 18, full: 999 },
  curved: { none: 0, sm: 10, md: 18, lg: 26, full: 999 },
} as const;

// Spacing / Density Scale Axis
export const spacingScales = {
  compact: { none: 0, xs: 2, sm: 6, md: 8, lg: 12, xl: 16, xxl: 24 },
  comfortable: { none: 0, xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 },
  spacious: { none: 0, xs: 6, sm: 12, md: 16, lg: 24, xl: 32, xxl: 48 },
} as const;

// Typography Scale Axis
export const typographyScales = {
  compact: { display: 26, title: 20, heading: 16, body: 14, small: 12, caption: 10 },
  default: { display: 32, title: 24, heading: 18, body: 16, small: 13, caption: 11 },
  editorial: { display: 38, title: 28, heading: 22, body: 17, small: 14, caption: 12 },
} as const;

// Surface Treatment Axis
export const surfaceStyles = {
  flat: 'flat',
  elevated: 'elevated',
  outlined: 'outlined',
} as const;

// Layout Composition Axis
export const layoutStyles = {
  standard: 'standard',
  editorial: 'editorial',
  immersive: 'immersive',
} as const;

// Media Treatment Axis
export const mediaTreatments = {
  contained: 'contained',
  'edge-to-edge': 'edge-to-edge',
  mosaic: 'mosaic',
} as const;

export interface ThemePresetDefinition {
  name: string;
  description: string;
  palette: PaletteName;
  radius: RadiusScaleName;
  density: DensityScaleName;
  typography: TypographyScaleName;
  surface: SurfaceStyleName;
  layout: LayoutAxisName;
  media: MediaTreatmentName;
}

// Prefabricated Archetypes for AI Agents and Factory Apps
export const presets: Record<PresetThemeName, ThemePresetDefinition> = {
  'minimal-pro': {
    name: 'Minimal Pro',
    description: 'Clean monochrome slate with structured borders and balanced native spacing. Ideal for productivity and developer tools.',
    palette: 'default',
    radius: 'smooth',
    density: 'comfortable',
    typography: 'default',
    surface: 'outlined',
    layout: 'standard',
    media: 'contained',
  },
  'kyoto-craft': {
    name: 'Kyoto Craft',
    description: 'Warm cedar, bamboo stone, and terracotta accents with editorial typographic hierarchy and edge-to-edge imagery. Ideal for culture, hospitality, and artisanal brands.',
    palette: 'kyoto',
    radius: 'smooth',
    density: 'comfortable',
    typography: 'editorial',
    surface: 'flat',
    layout: 'editorial',
    media: 'edge-to-edge',
  },
  'fintech-midnight': {
    name: 'Fintech Midnight',
    description: 'Deep obsidian and carbon with electric cyan highlights, tight data density, and sharp corners. Ideal for crypto, trading, and analytics.',
    palette: 'midnight',
    radius: 'sharp',
    density: 'compact',
    typography: 'compact',
    surface: 'elevated',
    layout: 'standard',
    media: 'contained',
  },
  'wellness-botanical': {
    name: 'Wellness Botanical',
    description: 'Calm pine, eucalyptus greens, soft curved corners, and generous airy whitespace. Ideal for health, mindfulness, and lifestyle.',
    palette: 'emerald',
    radius: 'curved',
    density: 'spacious',
    typography: 'default',
    surface: 'flat',
    layout: 'editorial',
    media: 'contained',
  },
  'editorial-luxury': {
    name: 'Editorial Luxury',
    description: 'Velvet burgundy and warm champagne tones with expressive headline scale, mosaic media layout, and expansive layout. Ideal for high-end fashion, dining, and magazines.',
    palette: 'crimson',
    radius: 'sharp',
    density: 'spacious',
    typography: 'editorial',
    surface: 'outlined',
    layout: 'editorial',
    media: 'mosaic',
  },
  'playful-consumer': {
    name: 'Playful Consumer',
    description: 'Warm golden honey accents, friendly curved pills, and immersive hero presentations. Ideal for social, gamified learning, and consumer services.',
    palette: 'amber',
    radius: 'curved',
    density: 'comfortable',
    typography: 'default',
    surface: 'elevated',
    layout: 'immersive',
    media: 'contained',
  },
};

// Global Factory Design Artifact Schema
export interface FactoryDesignConfig {
  $schema?: string;
  preset?: PresetThemeName;
  palette?: PaletteName;
  radius?: RadiusScaleName;
  density?: DensityScaleName;
  typography?: TypographyScaleName;
  surface?: SurfaceStyleName;
  layout?: LayoutAxisName;
  media?: MediaTreatmentName;
  mode?: ColorMode;
}

export function resolveDesignConfig(
  config?: Partial<FactoryDesignConfig>
): Required<Omit<FactoryDesignConfig, '$schema'>> {
  const presetDef = config?.preset ? presets[config.preset] : presets['minimal-pro'];
  return {
    preset: config?.preset ?? 'minimal-pro',
    palette: config?.palette ?? presetDef.palette,
    radius: config?.radius ?? presetDef.radius,
    density: config?.density ?? presetDef.density,
    typography: config?.typography ?? presetDef.typography,
    surface: config?.surface ?? presetDef.surface,
    layout: config?.layout ?? presetDef.layout,
    media: config?.media ?? presetDef.media,
    mode: config?.mode ?? 'light',
  };
}

// Stable experience geometry
export const geometry = {
  screenGutter: 20,
  sectionGap: 24,
  controlGap: 8,
  buttonHeight: 52,
  inputHeight: 52,
  listRowMinHeight: 60,
  iconTouchTarget: 48,
  touchTargets: { ios: 44, android: 48 },
  icons: { sm: 16, md: 20, lg: 24 },
  mediaRatios: { square: 1, portrait: 3 / 4, landscape: 4 / 3, wide: 16 / 9 },
} as const;

export const motion = {
  press: 'immediate',
  reveal: 'restrained',
  navigation: 'native',
  reducedMotion: 'respect-system',
} as const;

// Canonical default tokens (100% backward compatible with existing code)
export const tokens = {
  spacing: spacingScales.comfortable,
  radius: radiusScales.smooth,
  typography: typographyScales.default,
  colors: palettes.default,
  geometry,
  motion,
} as const;

export type Tokens = typeof tokens;
