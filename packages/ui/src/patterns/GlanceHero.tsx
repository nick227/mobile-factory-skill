import React from 'react';
import { View, Pressable, StyleSheet, type ViewStyle } from 'react-native';
import { useTheme } from '../foundation/theme';
import { Text } from '../primitives/Text';
import { RadialProgress } from '../controls/RadialProgress';

export type GlanceStatus = 'calm' | 'active' | 'warning' | 'alert';

export interface GlanceHeroProps {
  value: string | number;
  label: string;
  unit?: string;
  status?: GlanceStatus;
  statusText?: string;
  delta?: {
    value: string;
    positive?: boolean;
  };
  radialRing?: {
    value: number;
    max?: number;
    color?: string;
  };
  actions?: React.ReactNode;
  align?: 'center' | 'left';
  onPress?: () => void;
  style?: ViewStyle;
}

export function GlanceHero({
  value,
  label,
  unit,
  status = 'calm',
  statusText,
  delta,
  radialRing,
  actions,
  align = 'center',
  onPress,
  style,
}: GlanceHeroProps) {
  const { colors, tokens } = useTheme();

  // Determine status aura color
  let statusColor = colors.primary;
  if (status === 'calm') statusColor = colors.success;
  else if (status === 'active') statusColor = colors.primary;
  else if (status === 'warning') statusColor = colors.warning;
  else if (status === 'alert') statusColor = colors.danger;

  const isCenter = align === 'center';
  const isInteractive = Boolean(onPress);

  const accessibilityText = `${label}: ${value}${unit ? ' ' + unit : ''}${
    statusText ? `, Status: ${statusText}` : ''
  }${delta ? `, Change: ${delta.value}` : ''}`;

  const content = (
    <View
      style={[
        styles.root,
        {
          alignItems: isCenter ? 'center' : 'flex-start',
          gap: tokens.spacing.sm,
        },
        style,
      ]}
      accessible
      accessibilityRole={isInteractive ? 'button' : 'summary'}
      accessibilityLabel={accessibilityText}
    >
      {/* 1. Category Whisper & Status Aura Dot */}
      <View style={[styles.topRow, { justifyContent: isCenter ? 'center' : 'flex-start' }]}>
        <View style={styles.statusDotWrapper}>
          <View style={[styles.statusHalo, { backgroundColor: `${statusColor}25` }]} />
          <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
        </View>
        <Text
          variant="caption"
          style={[
            styles.categoryWhisper,
            {
              color: colors.muted,
            },
          ]}
        >
          {label}
        </Text>
      </View>

      {/* 2. Monumental Hero Metric (Optional radial ring cradle) */}
      <View
        style={[
          styles.metricContainer,
          {
            flexDirection: radialRing ? 'row' : 'column',
            alignItems: 'center',
            gap: tokens.spacing.md,
          },
        ]}
      >
        {radialRing && (
          <RadialProgress
            value={radialRing.value}
            max={radialRing.max ?? 100}
            size={76}
            strokeWidth={7}
            color={radialRing.color ?? statusColor}
          />
        )}

        <View style={[styles.valueRow, { alignItems: 'baseline' }]}>
          <Text
            style={[
              styles.monumentalValue,
              {
                color: colors.text,
                fontSize: tokens.typography.display * 1.5,
              },
            ]}
          >
            {value}
          </Text>
          {unit && (
            <Text
              style={[
                styles.unitText,
                {
                  color: colors.muted,
                  marginLeft: tokens.spacing.xs,
                  fontSize: tokens.typography.heading,
                },
              ]}
            >
              {unit}
            </Text>
          )}
        </View>
      </View>

      {/* 3. Serene Status Micro-Sentence & Delta */}
      {(statusText || delta) && (
        <View
          style={[
            styles.statusRow,
            {
              justifyContent: isCenter ? 'center' : 'flex-start',
              gap: tokens.spacing.xs,
            },
          ]}
        >
          {delta && (
            <View
              style={[
                styles.deltaBadge,
                {
                  backgroundColor: delta.positive ? `${colors.success}18` : `${colors.danger}18`,
                  borderRadius: tokens.radius.sm,
                  paddingHorizontal: tokens.spacing.xs,
                },
              ]}
            >
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: '700',
                  color: delta.positive ? colors.success : colors.danger,
                }}
              >
                {delta.positive ? '▲ ' : '▼ '}
                {delta.value}
              </Text>
            </View>
          )}
          {statusText && (
            <Text
              style={[
                styles.statusText,
                {
                  color: colors.muted,
                  textAlign: isCenter ? 'center' : 'left',
                },
              ]}
            >
              {statusText}
            </Text>
          )}
        </View>
      )}

      {/* 4. Optional Lockscreen Quick Actions */}
      {actions && <View style={styles.actionsContainer}>{actions}</View>}
    </View>
  );

  if (isInteractive) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [{ opacity: pressed ? 0.75 : 1 }]}
        accessibilityRole="button"
        accessibilityLabel={accessibilityText}
      >
        {content}
      </Pressable>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  root: {
    width: '100%',
    paddingVertical: 12,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusDotWrapper: {
    width: 14,
    height: 14,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  statusHalo: {
    position: 'absolute',
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  categoryWhisper: {
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  metricContainer: {
    justifyContent: 'center',
  },
  valueRow: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  monumentalValue: {
    fontWeight: '800',
    letterSpacing: -1.5,
    fontVariant: ['tabular-nums'],
    lineHeight: 64,
  },
  unitText: {
    fontWeight: '600',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  deltaBadge: {
    paddingVertical: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 18,
  },
  actionsContainer: {
    marginTop: 8,
    alignItems: 'center',
  },
});
