import React from 'react';
import { View, StyleSheet, type ViewStyle } from 'react-native';
import { useTheme } from '../foundation/theme';
import { Text } from '../primitives/Text';

export type RadialTone = 'primary' | 'success' | 'warning' | 'danger' | 'accent';

export interface RadialProgressProps {
  value: number;
  max?: number;
  size?: number;
  strokeWidth?: number;
  tone?: RadialTone;
  color?: string;
  trackColor?: string;
  label?: string;
  showValue?: boolean;
  children?: React.ReactNode;
  style?: ViewStyle;
}

export function RadialProgress({
  value,
  max = 100,
  size = 120,
  strokeWidth = 10,
  tone = 'primary',
  color,
  trackColor,
  label,
  showValue = false,
  children,
  style,
}: RadialProgressProps) {
  const { colors } = useTheme();

  const safeMax = max > 0 ? max : 100;
  const clampedValue = Math.max(0, Math.min(safeMax, value));
  const percentage = Math.round((clampedValue / safeMax) * 100);
  const angle = (percentage / 100) * 360;

  // Resolve active color from tone or explicit override
  let activeColor = color;
  if (!activeColor) {
    if (tone === 'success') activeColor = colors.success;
    else if (tone === 'warning') activeColor = colors.warning;
    else if (tone === 'danger') activeColor = colors.danger;
    else if (tone === 'accent') activeColor = colors.primary;
    else activeColor = colors.primary;
  }

  const resolvedTrackColor = trackColor ?? (colors.surface ? `${colors.border}60` : '#E2E8F0');
  const innerSize = size - strokeWidth * 2;
  const radius = size / 2;

  const firstArcRotation = Math.min(180, angle);
  const secondArcRotation = Math.max(0, angle - 180);

  const accessibilityLabel = label ?? `${percentage}% complete`;

  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={{ min: 0, max: safeMax, now: clampedValue }}
      style={[
        styles.root,
        {
          width: size,
          height: size,
        },
        style,
      ]}
    >
      {/* Background Track Circle */}
      <View
        style={[
          styles.trackCircle,
          {
            width: size,
            height: size,
            borderRadius: radius,
            borderWidth: strokeWidth,
            borderColor: resolvedTrackColor,
          },
        ]}
      />

      {/* Progress Half 1 (0 to 180 degrees) */}
      <View
        style={[
          styles.halfContainer,
          {
            width: size / 2,
            height: size,
            left: size / 2,
          },
        ]}
      >
        <View
          style={[
            styles.arcCircle,
            {
              width: size,
              height: size,
              borderRadius: radius,
              borderWidth: strokeWidth,
              borderColor: activeColor,
              borderLeftColor: 'transparent',
              borderBottomColor: 'transparent',
              left: -size / 2,
              transform: [{ rotate: `${-135 + firstArcRotation}deg` }],
            },
          ]}
        />
      </View>

      {/* Progress Half 2 (180 to 360 degrees) */}
      {angle > 180 && (
        <View
          style={[
            styles.halfContainer,
            {
              width: size / 2,
              height: size,
              left: 0,
            },
          ]}
        >
          <View
            style={[
              styles.arcCircle,
              {
                width: size,
                height: size,
                borderRadius: radius,
                borderWidth: strokeWidth,
                borderColor: activeColor,
                borderRightColor: 'transparent',
                borderTopColor: 'transparent',
                left: 0,
                transform: [{ rotate: `${-135 + secondArcRotation}deg` }],
              },
            ]}
          />
        </View>
      )}

      {/* Center Cutout for Children or Value */}
      <View
        style={[
          styles.centerSlot,
          {
            width: innerSize,
            height: innerSize,
            borderRadius: innerSize / 2,
          },
        ]}
      >
        {children ? (
          children
        ) : showValue ? (
          <View style={styles.valueContainer}>
            <Text
              style={{
                fontSize: Math.max(12, Math.round(size * 0.22)),
                fontWeight: '700',
                color: colors.text,
                fontVariant: ['tabular-nums'],
              }}
            >
              {percentage}
              <Text
                style={{
                  fontSize: Math.max(10, Math.round(size * 0.12)),
                  fontWeight: '600',
                  color: colors.muted,
                }}
              >
                %
              </Text>
            </Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  trackCircle: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  halfContainer: {
    position: 'absolute',
    top: 0,
    overflow: 'hidden',
  },
  arcCircle: {
    position: 'absolute',
    top: 0,
  },
  centerSlot: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  valueContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
