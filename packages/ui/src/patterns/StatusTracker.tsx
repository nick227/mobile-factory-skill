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
import { ProgressBar } from '../controls/ProgressBar';
import { Button } from '../controls/Button';

export type TrackerStatusTone = 'info' | 'success' | 'warning' | 'danger';

export interface StatusTrackerProps {
  title: string;
  statusLabel: string;
  tone?: TrackerStatusTone;
  description?: string;
  progress?: number; // 0 to 100
  estimatedTime?: string; // e.g. "Est. arrival 12:45 PM"
  primaryAction?: {
    label: string;
    onPress: () => void;
  };
  style?: ViewStyle;
}

export function StatusTracker({
  title,
  statusLabel,
  tone = 'info',
  description,
  progress,
  estimatedTime,
  primaryAction,
  style,
}: StatusTrackerProps) {
  const { colors } = useTheme();

  let toneColor: string = colors.primary;
  if (tone === 'success') toneColor = colors.success;
  else if (tone === 'warning') toneColor = colors.warning;
  else if (tone === 'danger') toneColor = colors.danger;

  const accessibilityLabel = `${title}: ${statusLabel}${
    progress !== undefined ? `, ${progress}% complete` : ''
  }${estimatedTime ? `, ${estimatedTime}` : ''}`;

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.surface, borderColor: colors.border },
        style,
      ]}
      accessible
      accessibilityRole="summary"
      accessibilityLabel={accessibilityLabel}
    >
      {/* Top row: Status pill + estimated time */}
      <View style={styles.topRow}>
        <View style={[styles.statusPill, { backgroundColor: `${toneColor}15` }]}>
          <View style={[styles.statusDot, { backgroundColor: toneColor }]} />
          <Text style={[styles.statusText, { color: toneColor }]}>
            {statusLabel}
          </Text>
        </View>
        {estimatedTime && (
          <Text style={[styles.estimatedTime, { color: colors.muted }]}>
            {estimatedTime}
          </Text>
        )}
      </View>

      {/* Main Title and Description */}
      <View style={styles.bodyBlock}>
        <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
        {description && (
          <Text style={[styles.description, { color: colors.muted }]}>
            {description}
          </Text>
        )}
      </View>

      {/* Progress Bar (if provided) */}
      {progress !== undefined && (
        <View style={styles.progressSection}>
          <ProgressBar label={statusLabel} value={progress} />
          <View style={styles.progressRow}>
            <Text style={[styles.progressLabel, { color: colors.muted }]}>Progress</Text>
            <Text
              style={[
                styles.progressValue,
                { color: colors.text, fontVariant: ['tabular-nums'] },
              ]}
            >
              {progress}%
            </Text>
          </View>
        </View>
      )}

      {/* Primary Action Button */}
      {primaryAction && (
        <View style={styles.actionContainer}>
          <Button
            label={primaryAction.label}
            onPress={primaryAction.onPress}
            variant="outline"
            fullWidth
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: tokens.spacing.md,
    borderRadius: tokens.radius.md,
    borderWidth: 1,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 1,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: tokens.spacing.sm,
    flexWrap: 'wrap',
    gap: tokens.spacing.xs,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: tokens.spacing.sm,
    paddingVertical: 4,
    borderRadius: tokens.radius.full,
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: tokens.typography.caption,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  estimatedTime: {
    fontSize: tokens.typography.caption,
    fontWeight: '500',
    flexShrink: 1,
  },
  bodyBlock: {
    marginBottom: tokens.spacing.sm,
  },
  title: {
    fontSize: tokens.typography.heading,
    fontWeight: '700',
  },
  description: {
    fontSize: tokens.typography.body,
    marginTop: tokens.spacing.xs,
  },
  progressSection: {
    marginTop: tokens.spacing.xs,
    gap: tokens.spacing.xs,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressLabel: {
    fontSize: tokens.typography.caption,
  },
  progressValue: {
    fontSize: tokens.typography.caption,
    fontWeight: '600',
  },
  actionContainer: {
    marginTop: tokens.spacing.md,
  },
});
