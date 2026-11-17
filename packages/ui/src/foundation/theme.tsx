import React, { createContext, useContext, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';
import {
  tokens as defaultTokens,
  palettes,
  radiusScales,
  spacingScales,
  typographyScales,
  presets,
  geometry,
  motion,
  resolveDesignConfig,
  type ColorMode,
  type PaletteName,
  type RadiusScaleName,
  type DensityScaleName,
  type TypographyScaleName,
  type SurfaceStyleName,
  type LayoutAxisName,
  type MediaTreatmentName,
  type PresetThemeName,
  type ThemePaletteColors,
  type FactoryDesignConfig,
} from './tokens';

export interface ThemeConfig {
  mode?: ColorMode | null;
  preset?: PresetThemeName;
  palette?: PaletteName;
  radius?: RadiusScaleName;
  density?: DensityScaleName;
  typography?: TypographyScaleName;
  surface?: SurfaceStyleName;
  layout?: LayoutAxisName;
  media?: MediaTreatmentName;
}

export interface ThemeContextValue {
  mode: ColorMode;
  palette: PaletteName;
  colors: ThemePaletteColors;
  radius: RadiusScaleName;
  density: DensityScaleName;
  typography: TypographyScaleName;
  surface: SurfaceStyleName;
  layout: LayoutAxisName;
  media: MediaTreatmentName;
  preset: PresetThemeName | null;
  designConfig: Required<Omit<FactoryDesignConfig, '$schema'>>;
  tokens: {
    spacing: typeof spacingScales[DensityScaleName];
    radius: typeof radiusScales[RadiusScaleName];
    typography: typeof typographyScales[TypographyScaleName];
    colors: typeof palettes[PaletteName];
    geometry: typeof geometry;
    motion: typeof motion;
  };
  setMode: (mode: ColorMode | null) => void;
  setPreset: (preset: PresetThemeName) => void;
  setTheme: (config: Partial<ThemeConfig>) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export interface ThemeProviderProps {
  mode?: ColorMode | null;
  preset?: PresetThemeName;
  palette?: PaletteName;
  radius?: RadiusScaleName;
  density?: DensityScaleName;
  typography?: TypographyScaleName;
  surface?: SurfaceStyleName;
  layout?: LayoutAxisName;
  media?: MediaTreatmentName;
  designConfig?: Partial<FactoryDesignConfig>;
  children: React.ReactNode;
}

export function ThemeProvider({
  mode: initialMode = null,
  preset: initialPreset,
  palette: initialPalette,
  radius: initialRadius,
  density: initialDensity,
  typography: initialTypography,
  surface: initialSurface,
  layout: initialLayout,
  media: initialMedia,
  designConfig,
  children,
}: ThemeProviderProps) {
  const system = useColorScheme();

  const baseConfig = designConfig ? resolveDesignConfig(designConfig) : null;

  const [activeMode, setActiveMode] = useState<ColorMode | null>(
    initialMode ?? baseConfig?.mode ?? null
  );
  const [activePreset, setActivePreset] = useState<PresetThemeName | null>(
    initialPreset ?? baseConfig?.preset ?? null
  );
  const [activePalette, setActivePalette] = useState<PaletteName | null>(
    initialPalette ?? baseConfig?.palette ?? null
  );
  const [activeRadius, setActiveRadius] = useState<RadiusScaleName | null>(
    initialRadius ?? baseConfig?.radius ?? null
  );
  const [activeDensity, setActiveDensity] = useState<DensityScaleName | null>(
    initialDensity ?? baseConfig?.density ?? null
  );
  const [activeTypography, setActiveTypography] = useState<TypographyScaleName | null>(
    initialTypography ?? baseConfig?.typography ?? null
  );
  const [activeSurface, setActiveSurface] = useState<SurfaceStyleName | null>(
    initialSurface ?? baseConfig?.surface ?? null
  );
  const [activeLayout, setActiveLayout] = useState<LayoutAxisName | null>(
    initialLayout ?? baseConfig?.layout ?? null
  );
  const [activeMedia, setActiveMedia] = useState<MediaTreatmentName | null>(
    initialMedia ?? baseConfig?.media ?? null
  );

  const effectivePresetDef = activePreset ? presets[activePreset] : null;

  const effectivePalette = activePalette ?? effectivePresetDef?.palette ?? 'default';
  const effectiveRadius = activeRadius ?? effectivePresetDef?.radius ?? 'smooth';
  const effectiveDensity = activeDensity ?? effectivePresetDef?.density ?? 'comfortable';
  const effectiveTypography = activeTypography ?? effectivePresetDef?.typography ?? 'default';
  const effectiveSurface = activeSurface ?? effectivePresetDef?.surface ?? 'outlined';
  const effectiveLayout = activeLayout ?? effectivePresetDef?.layout ?? 'standard';
  const effectiveMedia = activeMedia ?? effectivePresetDef?.media ?? 'contained';

  const effectiveMode: ColorMode = activeMode ?? (system === 'dark' ? 'dark' : 'light');
  const paletteColors = palettes[effectivePalette][effectiveMode];

  const setTheme = (config: Partial<ThemeConfig>) => {
    if (config.mode !== undefined) setActiveMode(config.mode);
    if (config.preset !== undefined) setActivePreset(config.preset);
    if (config.palette !== undefined) setActivePalette(config.palette);
    if (config.radius !== undefined) setActiveRadius(config.radius);
    if (config.density !== undefined) setActiveDensity(config.density);
    if (config.typography !== undefined) setActiveTypography(config.typography);
    if (config.surface !== undefined) setActiveSurface(config.surface);
    if (config.layout !== undefined) setActiveLayout(config.layout);
    if (config.media !== undefined) setActiveMedia(config.media);
  };

  const dynamicTokens = useMemo(() => {
    return {
      spacing: spacingScales[effectiveDensity],
      radius: radiusScales[effectiveRadius],
      typography: typographyScales[effectiveTypography],
      colors: palettes[effectivePalette],
      geometry,
      motion,
    };
  }, [effectiveDensity, effectiveRadius, effectiveTypography, effectivePalette]);

  const resolvedConfig: Required<Omit<FactoryDesignConfig, '$schema'>> = {
    preset: activePreset ?? 'minimal-pro',
    palette: effectivePalette,
    radius: effectiveRadius,
    density: effectiveDensity,
    typography: effectiveTypography,
    surface: effectiveSurface,
    layout: effectiveLayout,
    media: effectiveMedia,
    mode: effectiveMode,
  };

  const value: ThemeContextValue = {
    mode: effectiveMode,
    palette: effectivePalette,
    colors: paletteColors,
    radius: effectiveRadius,
    density: effectiveDensity,
    typography: effectiveTypography,
    surface: effectiveSurface,
    layout: effectiveLayout,
    media: effectiveMedia,
    preset: activePreset,
    designConfig: resolvedConfig,
    tokens: dynamicTokens,
    setMode: setActiveMode,
    setPreset: (preset) => {
      setActivePreset(preset);
      // Reset explicit axis overrides so preset takes effect cleanly
      setActivePalette(null);
      setActiveRadius(null);
      setActiveDensity(null);
      setActiveTypography(null);
      setActiveSurface(null);
      setActiveLayout(null);
      setActiveMedia(null);
    },
    setTheme,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  const system = useColorScheme();

  if (!context) {
    const defaultMode: ColorMode = system === 'dark' ? 'dark' : 'light';
    return {
      mode: defaultMode,
      palette: 'default',
      colors: palettes.default[defaultMode],
      radius: 'smooth',
      density: 'comfortable',
      typography: 'default',
      surface: 'outlined',
      layout: 'standard',
      media: 'contained',
      preset: null,
      designConfig: resolveDesignConfig({}),
      tokens: defaultTokens,
      setMode: () => {},
      setPreset: () => {},
      setTheme: () => {},
    };
  }

  return context;
}
