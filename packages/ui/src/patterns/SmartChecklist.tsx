import React from 'react';
import { View, TouchableOpacity, StyleSheet, type ViewStyle } from 'react-native';
import { Text } from '../primitives/Text';
import { Badge, type BadgeTone } from '../controls/Badge';
import { ProgressBar } from '../controls/ProgressBar';
import { Button } from '../controls/Button';
import { useTheme } from '../foundation/theme';
import { tokens } from '../foundation/tokens';

export interface SmartChecklistItem {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  required?: boolean;
  badge?: string;
  badgeTone?: BadgeTone;
}

export interface SmartChecklistProps {
  items: SmartChecklistItem[];
  onToggle: (id: string, completed: boolean) => void;
  title?: string;
  description?: string;
  showProgress?: boolean;
  action?: {
    label: string;
    onPress: () => void;
    disabled?: boolean;
  };
  style?: ViewStyle;
}

export function SmartChecklist({
  items,
  onToggle,
  title,
  description,
  showProgress = true,
  action,
  style,
}: SmartChecklistProps) {
  const { colors } = useTheme();

  const totalCount = items.length;
  const completedCount = items.filter((i) => i.completed).length;
  const percentComplete = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <View style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.border }, style]}>
      {/* Header */}
      {(title || showProgress) && (
        <View style={styles.header}>
          {title && (
            <View style={styles.titleRow}>
              <Text variant="heading">{title}</Text>
              <Badge
                label={`${completedCount}/${totalCount}`}
                tone={completedCount === totalCount ? 'success' : 'neutral'}
              />
            </View>
          )}
          {description && (
            <Text muted variant="small" style={{ marginTop: 2 }}>
              {description}
            </Text>
          )}

          {showProgress && (
            <View style={styles.progressContainer}>
              <ProgressBar label="Checklist progress" value={percentComplete} />
              <View style={styles.progressSubtext}>
                <Text muted variant="caption">
                  {percentComplete}% completed
                </Text>
                {completedCount === totalCount && (
                  <Text variant="caption" style={{ color: colors.success, fontWeight: '700' }}>
                    All items complete!
                  </Text>
                )}
              </View>
            </View>
          )}
        </View>
      )}

      {/* Checklist items */}
      <View style={styles.itemsList}>
        {items.map((item) => {
          const accessibilityLabel = `${item.title}, ${
            item.completed ? 'completed' : 'not completed'
          }${item.required ? ', required' : ''}`;

          return (
            <TouchableOpacity
              key={item.id}
              accessibilityRole="checkbox"
              accessibilityLabel={accessibilityLabel}
              accessibilityState={{ checked: item.completed }}
              onPress={() => onToggle(item.id, !item.completed)}
              activeOpacity={0.7}
              style={[
                styles.itemRow,
                {
                  borderColor: colors.border,
                  backgroundColor: item.completed ? `${colors.background}80` : colors.background,
                },
              ]}
            >
              {/* Checkbox circle indicator */}
              <View
                style={[
                  styles.checkboxCircle,
                  {
                    backgroundColor: item.completed ? colors.primary : 'transparent',
                    borderColor: item.completed ? colors.primary : colors.border,
                  },
                ]}
              >
                {item.completed && (
                  <Text style={[styles.checkmark, { color: colors.onPrimary }]}>✓</Text>
                )}
              </View>

              {/* Text content */}
              <View style={styles.textContent}>
                <View style={styles.itemTitleRow}>
                  <Text
                    style={[
                      styles.itemTitle,
                      {
                        color: item.completed ? colors.muted : colors.text,
                        textDecorationLine: item.completed ? 'line-through' : 'none',
                      },
                    ]}
                  >
                    {item.title}
                  </Text>
                  {item.badge && (
                    <Badge label={item.badge} tone={item.badgeTone || 'neutral'} />
                  )}
                  {item.required && !item.completed && (
                    <Badge label="Required" tone="warning" />
                  )}
                </View>
                {item.description && (
                  <Text muted variant="small" style={{ marginTop: 2 }}>
                    {item.description}
                  </Text>
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Action footer button */}
      {action && (
        <View style={styles.actionFooter}>
          <Button
            label={action.label}
            onPress={action.onPress}
            disabled={action.disabled}
            fullWidth
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: tokens.radius.md,
    borderWidth: 1,
    padding: tokens.spacing.md,
    gap: tokens.spacing.md,
  },
  header: {
    gap: tokens.spacing.xs,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressContainer: {
    marginTop: tokens.spacing.xs,
    gap: 4,
  },
  progressSubtext: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemsList: {
    gap: tokens.spacing.sm,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: tokens.spacing.md,
    borderRadius: tokens.radius.sm,
    borderWidth: 1,
    gap: tokens.spacing.md,
    minHeight: 56,
  },
  checkboxCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  checkmark: {
    fontSize: 13,
    fontWeight: '800',
  },
  textContent: {
    flex: 1,
  },
  itemTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: tokens.spacing.xs,
  },
  itemTitle: {
    fontSize: tokens.typography.body,
    fontWeight: '600',
    flex: 1,
  },
  actionFooter: {
    marginTop: tokens.spacing.xs,
  },
});
