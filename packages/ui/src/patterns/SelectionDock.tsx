import React from 'react';
import { View, StyleSheet, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '../primitives/Text';
import { Button } from '../controls/Button';
import { useTheme } from '../foundation/theme';
import { tokens } from '../foundation/tokens';

export interface SelectionDockAction {
  label: string;
  onPress: () => void;
  loading?: boolean;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  tone?: 'default' | 'danger';
}

export interface SelectionDockProps {
  selectedCount: number;
  title?: string;
  primaryAction: SelectionDockAction;
  secondaryAction?: SelectionDockAction;
  onClear?: () => void;
  clearLabel?: string;
  visible?: boolean;
  style?: ViewStyle;
}

export function SelectionDock({
  selectedCount,
  title,
  primaryAction,
  secondaryAction,
  onClear,
  clearLabel = 'Deselect',
  visible = true,
  style,
}: SelectionDockProps) {
  const { colors, mode } = useTheme();
  const insets = useSafeAreaInsets();

  if (!visible || selectedCount <= 0) {
    return null;
  }

  const defaultTitle = `${selectedCount} ${selectedCount === 1 ? 'item' : 'items'} selected`;

  return (
    <View
      style={[
        styles.dockWrapper,
        {
          paddingBottom: Math.max(tokens.spacing.md, insets.bottom),
        },
      ]}
    >
      <View
        style={[
          styles.dockContainer,
          {
            backgroundColor: mode === 'dark' ? colors.surface : colors.background,
            borderColor: colors.border,
            shadowColor: '#000000',
            shadowOpacity: mode === 'dark' ? 0.45 : 0.12,
          },
          style,
        ]}
        accessible
        accessibilityRole="toolbar"
        accessibilityLabel={title || defaultTitle}
      >
        {/* Info Column */}
        <View style={styles.infoCol}>
          <Text style={{ fontWeight: '700', fontSize: tokens.typography.body }}>
            {title || defaultTitle}
          </Text>
          {onClear && (
            <Button
              label={clearLabel}
              variant="ghost"
              size="sm"
              onPress={onClear}
              style={{ paddingHorizontal: 0 }}
            />
          )}
        </View>

        {/* Action Buttons */}
        <View style={styles.actionRow}>
          {secondaryAction && (
            <Button
              label={secondaryAction.label}
              variant={secondaryAction.variant || 'outline'}
              tone={secondaryAction.tone}
              loading={secondaryAction.loading}
              onPress={secondaryAction.onPress}
              size="sm"
            />
          )}
          <Button
            label={primaryAction.label}
            variant={primaryAction.variant || 'primary'}
            tone={primaryAction.tone}
            loading={primaryAction.loading}
            onPress={primaryAction.onPress}
            size="sm"
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  dockWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: tokens.spacing.md,
    alignItems: 'center',
    zIndex: 100,
  },
  dockContainer: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: tokens.spacing.sm,
    paddingHorizontal: tokens.spacing.md,
    borderRadius: tokens.radius.full,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 16,
    elevation: 8,
  },
  infoCol: {
    flex: 1,
    justifyContent: 'center',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing.sm,
  },
});
