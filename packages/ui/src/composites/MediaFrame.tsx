import React, { useState } from 'react';
import { View, StyleSheet, type ImageStyle, type ViewStyle } from 'react-native';
import { Image, type ImageSource } from 'expo-image';
import { Text } from '../primitives/Text';
import { useTheme } from '../foundation/theme';
import { geometry, tokens } from '../foundation/tokens';

export interface MediaFrameProps {
  source?: ImageSource | string | number | null;
  ratio?: number;
  fit?: 'cover' | 'contain';
  placeholder?: ImageSource | string | number;
  label?: string;
  radius?: number;
  style?: ImageStyle;
  containerStyle?: ViewStyle;
}

export function MediaFrame({
  source,
  ratio = geometry.mediaRatios.square,
  fit = 'cover',
  placeholder,
  label,
  radius = 16,
  style,
  containerStyle,
}: MediaFrameProps) {
  const { colors } = useTheme();
  const [failed, setFailed] = useState(false);
  const usable = Number.isFinite(ratio) && ratio > 0 ? ratio : geometry.mediaRatios.square;
  const normalizedSource = typeof source === 'string' ? { uri: source } : source;

  const hasSource = Boolean(source) && !failed;

  return (
    <View
      accessible
      accessibilityLabel={label || 'Media display'}
      style={[
        styles.container,
        {
          aspectRatio: usable,
          borderRadius: radius,
          backgroundColor: colors.surface,
          borderColor: colors.border,
        },
        containerStyle,
      ]}
    >
      {hasSource ? (
        <Image
          source={normalizedSource!}
          placeholder={placeholder}
          contentFit={fit}
          transition={200}
          cachePolicy="memory-disk"
          accessibilityLabel={label}
          onError={() => setFailed(true)}
          style={[styles.image, style]}
        />
      ) : (
        <View style={styles.fallbackContainer}>
          <Text style={{ fontSize: 28, color: colors.muted, opacity: 0.6 }}>🖼️</Text>
          {label && (
            <Text muted variant="caption" style={{ marginTop: tokens.spacing.xs, textAlign: 'center' }}>
              {label}
            </Text>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    maxWidth: '100%',
    overflow: 'hidden',
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  fallbackContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: tokens.spacing.md,
  },
});
