import React from 'react';
import { View, Pressable, StyleSheet, type ViewStyle } from 'react-native';
import { useTheme } from '../foundation/theme';
import { Text } from '../primitives/Text';

export interface ControlTileProps {
  label: string;
  subtitle?: string;
  icon: React.ReactNode;
  active?: boolean;
  onPress: () => void;
  onLongPress?: () => void;
  aspect?: 'square' | 'wide';
  activeColor?: string;
  badge?: string;
  disabled?: boolean;
  style?: ViewStyle;
}

export function ControlTile({
  label,
  subtitle,
  icon,
  active = false,
  onPress,
  onLongPress,
  aspect = 'square',
  activeColor,
  badge,
  disabled = false,
  style,
}: ControlTileProps) {
  const { colors, tokens } = useTheme();

  const isWide = aspect === 'wide';
  const resolvedActiveBg = activeColor ?? colors.primary;

  const bg = active ? resolvedActiveBg : colors.surface;
  const fg = active ? colors.onPrimary : colors.text;
  const mutedFg = active ? `${colors.onPrimary}CC` : colors.muted;
  const borderColor = active ? 'transparent' : colors.border;

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={subtitle ? `${label}, ${subtitle}` : label}
      accessibilityState={{ selected: active, disabled }}
      style={({ pressed }) => [
        styles.tile,
        {
          backgroundColor: bg,
          borderColor,
          borderRadius: tokens.radius.lg,
          padding: tokens.spacing.md,
          minHeight: isWide ? 68 : 88,
          flex: isWide ? 2 : 1,
          transform: [{ scale: pressed && !disabled ? 0.96 : 1 }],
          opacity: disabled ? 0.45 : 1,
        },
        style,
      ]}
    >
      {/* Top row: Icon slot + Optional badge */}
      <View
        style={[
          styles.contentLayout,
          {
            flexDirection: isWide ? 'row' : 'column',
            justifyContent: isWide ? 'space-between' : 'space-between',
            alignItems: isWide ? 'center' : 'flex-start',
            gap: tokens.spacing.sm,
          },
        ]}
      >
        <View style={styles.iconAndBadgeRow}>
          <View
            style={[
              styles.iconSlot,
              {
                backgroundColor: active ? `${colors.onPrimary}20` : `${colors.border}40`,
                borderRadius: tokens.radius.md,
              },
            ]}
          >
            {icon}
          </View>
          {badge && (
            <View
              style={[
                styles.badgeContainer,
                {
                  backgroundColor: active ? colors.onPrimary : colors.primary,
                  borderRadius: tokens.radius.full,
                  paddingHorizontal: tokens.spacing.xs,
                },
              ]}
            >
              <Text
                style={{
                  fontSize: 10,
                  fontWeight: '700',
                  color: active ? colors.primary : colors.onPrimary,
                }}
              >
                {badge}
              </Text>
            </View>
          )}
        </View>

        {/* Text information */}
        <View style={[styles.textSlot, { flex: isWide ? 1 : 0, marginLeft: isWide ? tokens.spacing.xs : 0 }]}>
          <Text
            style={[
              styles.label,
              {
                color: fg,
                fontSize: tokens.typography.body,
              },
            ]}
            numberOfLines={1}
          >
            {label}
          </Text>
          {subtitle && (
            <Text
              style={[
                styles.subtitle,
                {
                  color: mutedFg,
                },
              ]}
              numberOfLines={1}
            >
              {subtitle}
            </Text>
          )}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tile: {
    borderWidth: 1,
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  contentLayout: {
    height: '100%',
    width: '100%',
  },
  iconAndBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  iconSlot: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeContainer: {
    paddingVertical: 2,
    alignSelf: 'flex-start',
  },
  textSlot: {
    gap: 2,
  },
  label: {
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '500',
  },
});
