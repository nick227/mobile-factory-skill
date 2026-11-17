import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  type ViewStyle,
} from 'react-native';
import { useTheme } from '../foundation/theme';
import { tokens } from '../foundation/tokens';
import { CalmSkeleton } from '../controls/CalmSkeleton';

export interface MetricDelta {
  value: string; // e.g. "+12.4%", "-3.2%"
  direction: 'up' | 'down' | 'neutral';
  tone?: 'positive' | 'negative' | 'neutral';
  period?: string; // e.g. "vs last month"
}

export interface MetricSpotlightProps {
  label: string;
  value: string | number;
  unit?: string;
  delta?: MetricDelta;
  sparklineData?: number[]; // Values normalized between 0-100 or relative numbers
  description?: string;
  loading?: boolean;
  onPress?: () => void;
  actionLabel?: string;
  style?: ViewStyle;
}

export function MetricSpotlight({
  label,
  value,
  unit,
  delta,
  sparklineData,
  description,
  loading = false,
  onPress,
  actionLabel,
  style,
}: MetricSpotlightProps) {
  const { colors } = useTheme();

  if (loading) {
    return (
      <View
        style={[
          styles.container,
          { backgroundColor: colors.surface, borderColor: colors.border },
          style,
        ]}
      >
        <CalmSkeleton width="40%" height={16} radius={tokens.radius.sm} />
        <View style={styles.skeletonSpacing} />
        <CalmSkeleton width="70%" height={36} radius={tokens.radius.sm} />
        <View style={styles.skeletonSpacing} />
        <CalmSkeleton width="50%" height={14} radius={tokens.radius.sm} />
      </View>
    );
  }

  // Determine delta tone colors
  let deltaColor: string = colors.muted;
  let deltaIcon = '―';
  const effectiveTone =
    delta?.tone ??
    (delta?.direction === 'up'
      ? 'positive'
      : delta?.direction === 'down'
      ? 'negative'
      : 'neutral');

  if (effectiveTone === 'positive') {
    deltaColor = colors.success;
    deltaIcon = '▲';
  } else if (effectiveTone === 'negative') {
    deltaColor = colors.danger;
    deltaIcon = '▼';
  }

  const accessibilityText = `${label}: ${value}${unit ? ' ' + unit : ''}${
    delta ? `, ${delta.direction === 'up' ? 'up' : delta.direction === 'down' ? 'down' : 'unchanged'} ${delta.value}${delta.period ? ' ' + delta.period : ''}` : ''
  }`;

  // Normalize sparkline values if provided
  let sparkBars: number[] = [];
  if (sparklineData && sparklineData.length > 0) {
    const min = Math.min(...sparklineData);
    const max = Math.max(...sparklineData);
    const range = max - min || 1;
    sparkBars = sparklineData.map((v) => Math.max(15, Math.round(((v - min) / range) * 100)));
  }

  const content = (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.surface, borderColor: colors.border },
        style,
      ]}
      accessible
      accessibilityRole="summary"
      accessibilityLabel={accessibilityText}
    >
      {/* Label and Action */}
      <View style={styles.topRow}>
        <Text style={[styles.label, { color: colors.muted }]}>{label}</Text>
        {actionLabel && (
          <Text style={[styles.actionLabel, { color: colors.primary }]}>
            {actionLabel}
          </Text>
        )}
      </View>

      {/* Primary Value + Sparkline */}
      <View style={styles.metricRow}>
        <View style={styles.valueGroup}>
          <Text
            style={[
              styles.valueText,
              { color: colors.text, fontVariant: ['tabular-nums'] },
            ]}
          >
            {value}
          </Text>
          {unit && (
            <Text style={[styles.unitText, { color: colors.muted }]}>
              {unit}
            </Text>
          )}
        </View>

        {/* Sparkline mini-bars */}
        {sparkBars.length > 0 && (
          <View style={styles.sparklineContainer}>
            {sparkBars.map((heightPercent, index) => (
              <View
                key={index}
                style={[
                  styles.sparkBar,
                  {
                    height: `${heightPercent}%`,
                    backgroundColor:
                      index === sparkBars.length - 1 ? colors.primary : colors.border,
                  },
                ]}
              />
            ))}
          </View>
        )}
      </View>

      {/* Delta indicator & period */}
      {delta && (
        <View style={styles.deltaRow}>
          <View style={[styles.deltaBadge, { backgroundColor: `${deltaColor}15` }]}>
            <Text style={[styles.deltaIcon, { color: deltaColor }]}>{deltaIcon}</Text>
            <Text
              style={[
                styles.deltaValue,
                { color: deltaColor, fontVariant: ['tabular-nums'] },
              ]}
            >
              {delta.value}
            </Text>
          </View>
          {delta.period && (
            <Text style={[styles.periodText, { color: colors.muted }]}>
              {delta.period}
            </Text>
          )}
        </View>
      )}

      {/* Optional description */}
      {description && (
        <Text style={[styles.description, { color: colors.muted }]}>
          {description}
        </Text>
      )}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={accessibilityText}
        activeOpacity={0.8}
      >
        {content}
      </TouchableOpacity>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  container: {
    padding: tokens.spacing.md,
    borderRadius: tokens.radius.md,
    borderWidth: 1,
  },
  skeletonSpacing: {
    height: tokens.spacing.sm,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: tokens.spacing.xs,
  },
  label: {
    fontSize: tokens.typography.small,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  actionLabel: {
    fontSize: tokens.typography.small,
    fontWeight: '600',
  },
  metricRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginVertical: tokens.spacing.xs,
  },
  valueGroup: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: tokens.spacing.xs,
  },
  valueText: {
    fontSize: tokens.typography.display,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  unitText: {
    fontSize: tokens.typography.heading,
    fontWeight: '500',
  },
  sparklineContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 3,
    height: 32,
    width: 64,
  },
  sparkBar: {
    flex: 1,
    minHeight: 4,
    borderRadius: 2,
  },
  deltaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing.xs,
    marginTop: tokens.spacing.xs,
  },
  deltaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: tokens.radius.sm,
    gap: 2,
  },
  deltaIcon: {
    fontSize: 9,
    fontWeight: '700',
  },
  deltaValue: {
    fontSize: tokens.typography.small,
    fontWeight: '600',
  },
  periodText: {
    fontSize: tokens.typography.small,
  },
  description: {
    fontSize: tokens.typography.small,
    marginTop: tokens.spacing.xs,
  },
});
