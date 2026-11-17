import React, { useState } from 'react';
import { View, StyleSheet, type ViewStyle, type ImageStyle } from 'react-native';
import { Image } from 'expo-image';
import { Text } from '../primitives/Text';
import { useTheme } from '../foundation/theme';

export interface AvatarProps {
  name: string;
  uri?: string | null;
  size?: number;
  style?: ViewStyle;
}

const PALETTES = [
  { bg: '#EAE1D9', text: '#5D4037' }, // warm clay
  { bg: '#E2E8F0', text: '#334155' }, // slate
  { bg: '#E0E7FF', text: '#3730A3' }, // indigo
  { bg: '#DCFCE7', text: '#166534' }, // sage emerald
  { bg: '#FEF3C7', text: '#92400E' }, // amber
  { bg: '#FCE7F3', text: '#9D174D' }, // rose
  { bg: '#F3E8FF', text: '#6B21A8' }, // violet
  { bg: '#E0F2FE', text: '#075985' }, // sky
];

function getPaletteForName(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return PALETTES[Math.abs(hash) % PALETTES.length];
}

export function Avatar({ name, uri, size = 44, style }: AvatarProps) {
  const { colors, mode } = useTheme();
  const [imgFailed, setImgFailed] = useState(false);

  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((x) => x[0] || '')
    .join('')
    .toUpperCase();

  const palette = getPaletteForName(name);
  const shape: ViewStyle = {
    width: size,
    height: size,
    borderRadius: size / 2,
  };

  const hasImage = Boolean(uri) && !imgFailed;

  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={name}
      style={[
        shape,
        styles.container,
        {
          backgroundColor: mode === 'dark' ? colors.surface : palette.bg,
          borderColor: colors.border,
        },
        style,
      ]}
    >
      {hasImage ? (
        <Image
          source={{ uri: uri! }}
          accessibilityLabel={name}
          onError={() => setImgFailed(true)}
          contentFit="cover"
          transition={150}
          cachePolicy="memory-disk"
          style={[shape as ImageStyle, styles.image]}
        />
      ) : (
        <Text
          style={{
            fontSize: Math.max(11, Math.round(size * 0.36)),
            fontWeight: '700',
            color: mode === 'dark' ? colors.text : palette.text,
            letterSpacing: 0.5,
          }}
        >
          {initials || '?'}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  image: {
    width: '100%',
    height: '100%',
  },
});
