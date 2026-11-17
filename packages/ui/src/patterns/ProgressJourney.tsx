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

export type JourneyStepStatus = 'completed' | 'active' | 'upcoming' | 'failed';

export interface JourneyStep {
  id: string;
  title: string;
  description?: string;
  timestamp?: string;
  status: JourneyStepStatus;
}

export interface ProgressJourneyProps {
  steps: JourneyStep[];
  onPressStep?: (stepId: string) => void;
  style?: ViewStyle;
}

export function ProgressJourney({
  steps,
  onPressStep,
  style,
}: ProgressJourneyProps) {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, style]}>
      {steps.map((step, index) => {
        const isLast = index === steps.length - 1;

        let nodeColor: string = colors.border;
        let nodeTextColor: string = colors.muted;
        let nodeIcon = `${index + 1}`;

        if (step.status === 'completed') {
          nodeColor = colors.primary;
          nodeTextColor = colors.onPrimary;
          nodeIcon = '✓';
        } else if (step.status === 'active') {
          nodeColor = colors.primary;
          nodeTextColor = colors.onPrimary;
          nodeIcon = '●';
        } else if (step.status === 'failed') {
          nodeColor = colors.danger;
          nodeTextColor = colors.onPrimary;
          nodeIcon = '!';
        }

        const accessibilityLabel = `Step ${index + 1}: ${step.title}, ${step.status}${
          step.timestamp ? ', ' + step.timestamp : ''
        }`;

        const stepContent = (
          <View style={styles.stepRow}>
            {/* Left timeline stem + node */}
            <View style={styles.timelineColumn}>
              <View
                style={[
                  styles.nodeCircle,
                  {
                    backgroundColor:
                      step.status === 'upcoming' ? colors.surface : nodeColor,
                    borderColor: nodeColor,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.nodeIconText,
                    {
                      color:
                        step.status === 'upcoming' ? colors.muted : nodeTextColor,
                      fontSize: step.status === 'active' ? 10 : 12,
                    },
                  ]}
                >
                  {nodeIcon}
                </Text>
              </View>
              {!isLast && (
                <View
                  style={[
                    styles.timelineStem,
                    {
                      backgroundColor:
                        step.status === 'completed' ? colors.primary : colors.border,
                    },
                  ]}
                />
              )}
            </View>

            {/* Right content */}
            <View style={[styles.contentColumn, { paddingBottom: isLast ? 0 : tokens.spacing.lg }]}>
              <View style={styles.stepHeader}>
                <Text
                  style={[
                    styles.stepTitle,
                    {
                      color: colors.text,
                      fontWeight: step.status === 'active' ? '700' : '600',
                    },
                  ]}
                >
                  {step.title}
                </Text>
                {step.timestamp && (
                  <Text style={[styles.stepTimestamp, { color: colors.muted }]}>
                    {step.timestamp}
                  </Text>
                )}
              </View>
              {step.description && (
                <Text style={[styles.stepDescription, { color: colors.muted }]}>
                  {step.description}
                </Text>
              )}
            </View>
          </View>
        );

        if (onPressStep) {
          return (
            <TouchableOpacity
              key={step.id}
              accessibilityRole="button"
              accessibilityLabel={accessibilityLabel}
              onPress={() => onPressStep(step.id)}
            >
              {stepContent}
            </TouchableOpacity>
          );
        }

        return (
          <View
            key={step.id}
            accessible
            accessibilityRole="text"
            accessibilityLabel={accessibilityLabel}
          >
            {stepContent}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: tokens.spacing.sm,
  },
  stepRow: {
    flexDirection: 'row',
  },
  timelineColumn: {
    alignItems: 'center',
    width: 32,
    marginRight: tokens.spacing.sm,
  },
  nodeCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  nodeIconText: {
    fontWeight: '700',
  },
  timelineStem: {
    width: 2,
    flex: 1,
    marginTop: -2,
    marginBottom: -2,
  },
  contentColumn: {
    flex: 1,
    justifyContent: 'flex-start',
  },
  stepHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    gap: tokens.spacing.xs,
  },
  stepTitle: {
    fontSize: tokens.typography.body,
  },
  stepTimestamp: {
    fontSize: tokens.typography.caption,
  },
  stepDescription: {
    fontSize: tokens.typography.small,
    marginTop: tokens.spacing.xs,
    lineHeight: 18,
  },
});
