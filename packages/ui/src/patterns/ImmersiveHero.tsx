import React, { useState } from 'react';
import { View, Pressable, type ViewStyle, type StyleProp } from 'react-native';
import { Image, type ImageSource } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../foundation/theme';
import { geometry } from '../foundation/tokens';
import { Text } from '../primitives/Text';
import { Badge } from '../controls/Badge';
import { Button, type ButtonProps } from '../controls/Button';

export interface ImmersiveHeroProps {
  title: string;
  subtitle?: string;
  tag?: string;
  tagTone?: 'neutral' | 'accent';
  metadata?: string;
  image?: ImageSource | string | number | null;
  aspectRatio?: number;
  height?: number;
  onBack?: () => void;
  backLabel?: string;
  primaryAction?: ButtonProps;
  secondaryAction?: ButtonProps;
  actions?: React.ReactNode;
  overlayOpacity?: number;
  align?: 'bottom' | 'center';
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}

export function ImmersiveHero({
  title,
  subtitle,
  tag,
  tagTone = 'accent',
  metadata,
  image,
  aspectRatio = 4 / 3,
  height,
  onBack,
  backLabel = 'Back',
  primaryAction,
  secondaryAction,
  actions,
  overlayOpacity = 0.45,
  align = 'bottom',
  style,
  accessibilityLabel,
}: ImmersiveHeroProps) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const [imageError, setImageError] = useState(false);

  const containerStyle: ViewStyle = {
    width: '100%',
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: colors.surface,
    ...(height ? { height } : { aspectRatio: Number.isFinite(aspectRatio) && aspectRatio > 0 ? aspectRatio : 4 / 3 }),
  };

  const hasImage = Boolean(image && !imageError);

  return (
    <View
      style={[containerStyle, style]}
      accessibilityRole="header"
      accessibilityLabel={accessibilityLabel ?? title}
    >
      {/* Background Media */}
      {hasImage ? (
        <Image
          source={image}
          contentFit="cover"
          transition={0}
          cachePolicy="memory-disk"
          accessibilityLabel={title}
          onError={() => setImageError(true)}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: '100%',
            height: '100%',
          }}
        />
      ) : (
        <View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: '#1E232A',
          }}
        />
      )}

      {/* Scrim Overlay for Guaranteed Contrast */}
      <View
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: `rgba(0, 0, 0, ${overlayOpacity})`,
        }}
      />

      {/* Top Bar with Safe Area and Back Navigation */}
      <View
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          paddingTop: Math.max(insets.top, 12),
          paddingHorizontal: geometry.screenGutter,
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          zIndex: 2,
        }}
      >
        {onBack ? (
          <Pressable
            onPress={onBack}
            accessibilityRole="button"
            accessibilityLabel={backLabel}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={({ pressed }) => ({
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              paddingHorizontal: 12,
              paddingVertical: 6,
              minHeight: 44,
              justifyContent: 'center',
              borderRadius: 22,
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '600' }}>
              ← {backLabel}
            </Text>
          </Pressable>
        ) : (
          <View />
        )}

        {tag ? <Badge label={tag} tone={tagTone} /> : null}
      </View>

      {/* Content Section (Title, Subtitle, Metadata, Actions) */}
      <View
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          paddingHorizontal: geometry.screenGutter,
          paddingBottom: Math.max(insets.bottom, geometry.screenGutter),
          paddingTop: 16,
          justifyContent: align === 'center' ? 'center' : 'flex-end',
          zIndex: 1,
        }}
      >
        {metadata ? (
          <Text style={{ color: 'rgba(255, 255, 255, 0.75)', fontSize: 12, marginBottom: 4 }}>
            {metadata}
          </Text>
        ) : null}

        <Text
          variant="title"
          style={{
            color: '#FFFFFF',
            fontWeight: '700',
            textShadowColor: 'rgba(0, 0, 0, 0.6)',
            textShadowOffset: { width: 0, height: 1 },
            textShadowRadius: 3,
          }}
        >
          {title}
        </Text>

        {subtitle ? (
          <Text
            style={{
              color: 'rgba(255, 255, 255, 0.9)',
              fontSize: 15,
              lineHeight: 20,
              marginTop: 4,
            }}
          >
            {subtitle}
          </Text>
        ) : null}

        {/* Action Buttons */}
        {actions ? (
          <View style={{ marginTop: 16 }}>{actions}</View>
        ) : primaryAction || secondaryAction ? (
          <View
            style={{
              flexDirection: 'row',
              gap: 8,
              marginTop: 16,
              alignItems: 'center',
            }}
          >
            {primaryAction ? (
              <View style={{ flex: secondaryAction ? 1 : 0, minWidth: 120 }}>
                <Button
                  accessibilityLabel={primaryAction.accessibilityLabel ?? primaryAction.label}
                  {...primaryAction}
                />
              </View>
            ) : null}
            {secondaryAction ? (
              <View style={{ flex: 1 }}>
                <Button
                  variant="outline"
                  accessibilityLabel={secondaryAction.accessibilityLabel ?? secondaryAction.label}
                  {...secondaryAction}
                />
              </View>
            ) : null}
          </View>
        ) : null}
      </View>
    </View>
  );
}
