import React from 'react';
import { View, Pressable, StyleSheet, type ViewStyle } from 'react-native';
import { useTheme } from '../foundation/theme';
import { Text } from '../primitives/Text';

export type LiveTone = 'live' | 'calm' | 'warning' | 'completed';

export interface LiveActivityCardProps {
  title: string;
  subtitle?: string;
  leadingIcon: React.ReactNode;
  trailingMetric?: string;
  progress?: number; // 0 to 1
  statusTone?: LiveTone;
  actionLabel?: string;
  onAction?: () => void;
  expandedContent?: React.ReactNode;
  expanded?: boolean;
  onToggleExpand?: () => void;
  style?: ViewStyle;
}

export function LiveActivityCard({
  title,
  subtitle,
  leadingIcon,
  trailingMetric,
  progress,
  statusTone = 'live',
  actionLabel,
  onAction,
  expandedContent,
  expanded = false,
  onToggleExpand,
  style,
}: LiveActivityCardProps) {
  const { colors, mode, tokens } = useTheme();

  // Tone color resolution
  let toneColor = colors.primary;
  if (statusTone === 'live') toneColor = '#10B981'; // Vivid live emerald
  else if (statusTone === 'calm') toneColor = colors.primary;
  else if (statusTone === 'warning') toneColor = colors.warning;
  else if (statusTone === 'completed') toneColor = colors.success;

  const isInteractive = Boolean(onToggleExpand);
  const bg = mode === 'dark' ? '#0F1219' : colors.surface;
  const clampedProgress = progress !== undefined ? Math.max(0, Math.min(1, progress)) : undefined;

  const accessibilityLabel = `Live activity: ${title}${subtitle ? `, ${subtitle}` : ''}${
    trailingMetric ? `, ${trailingMetric}` : ''
  }`;

  const content = (
    <View
      style={[
        styles.card,
        {
          backgroundColor: bg,
          borderColor: mode === 'dark' ? `${toneColor}30` : colors.border,
          borderRadius: tokens.radius.lg,
          padding: tokens.spacing.md,
          gap: tokens.spacing.sm,
          shadowColor: toneColor,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: mode === 'dark' ? 0.25 : 0.08,
          shadowRadius: 12,
        },
        style,
      ]}
      accessibilityRole="summary"
      accessibilityLabel={accessibilityLabel}
    >
      {/* Primary Capsule Row */}
      <View style={styles.primaryRow}>
        {/* Leading icon with pulsing live dot */}
        <View style={styles.leadingSlot}>
          <View
            style={[
              styles.iconWrapper,
              {
                backgroundColor: `${toneColor}18`,
                borderRadius: tokens.radius.md,
              },
            ]}
          >
            {leadingIcon}
          </View>
          <View style={[styles.pulseDot, { backgroundColor: toneColor }]} />
        </View>

        {/* Center Title and Status Ticker */}
        <View style={styles.textColumn}>
          <Text
            style={[
              styles.title,
              {
                color: colors.text,
                fontSize: tokens.typography.body,
              },
            ]}
            numberOfLines={1}
          >
            {title}
          </Text>
          {subtitle && (
            <Text
              style={[
                styles.subtitle,
                {
                  color: colors.muted,
                },
              ]}
              numberOfLines={1}
            >
              {subtitle}
            </Text>
          )}
        </View>

        {/* Trailing Metric / Countdown / Action */}
        <View style={styles.trailingSlot}>
          {trailingMetric && (
            <Text
              style={[
                styles.metricText,
                {
                  color: toneColor,
                  fontVariant: ['tabular-nums'],
                },
              ]}
            >
              {trailingMetric}
            </Text>
          )}

          {actionLabel && onAction && (
            <Pressable
              onPress={onAction}
              accessibilityRole="button"
              accessibilityLabel={actionLabel}
              style={({ pressed }) => [
                styles.actionButton,
                {
                  backgroundColor: `${toneColor}20`,
                  borderRadius: tokens.radius.full,
                  paddingHorizontal: tokens.spacing.sm,
                  opacity: pressed ? 0.7 : 1,
                },
              ]}
            >
              <Text style={[styles.actionText, { color: toneColor }]}>
                {actionLabel}
              </Text>
            </Pressable>
          )}
        </View>
      </View>

      {/* Optional Slim Live Progress Bar */}
      {clampedProgress !== undefined && (
        <View
          style={[
            styles.progressTrack,
            {
              backgroundColor: `${colors.border}60`,
              borderRadius: tokens.radius.full,
            },
          ]}
        >
          <View
            style={[
              styles.progressFill,
              {
                backgroundColor: toneColor,
                width: `${Math.round(clampedProgress * 100)}%`,
                borderRadius: tokens.radius.full,
              },
            ]}
          />
        </View>
      )}

      {/* Expandable Content Slot */}
      {expanded && expandedContent && (
        <View style={[styles.expandedSlot, { borderTopColor: colors.border, paddingTop: tokens.spacing.sm }]}>
          {expandedContent}
        </View>
      )}
    </View>
  );

  if (isInteractive) {
    return (
      <Pressable
        onPress={onToggleExpand}
        accessibilityRole="button"
        accessibilityLabel={`${accessibilityLabel}. Tap to ${expanded ? 'collapse' : 'expand'}`}
        style={({ pressed }) => [{ opacity: pressed ? 0.85 : 1 }]}
      >
        {content}
      </Pressable>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    width: '100%',
    elevation: 4,
  },
  primaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  leadingSlot: {
    position: 'relative',
    marginRight: 12,
  },
  iconWrapper: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulseDot: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  textColumn: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '500',
  },
  trailingSlot: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    marginLeft: 8,
    gap: 4,
  },
  metricText: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  actionButton: {
    paddingVertical: 4,
  },
  actionText: {
    fontSize: 11,
    fontWeight: '700',
  },
  progressTrack: {
    height: 4,
    width: '100%',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
  },
  expandedSlot: {
    borderTopWidth: StyleSheet.hairlineWidth,
    width: '100%',
  },
});
