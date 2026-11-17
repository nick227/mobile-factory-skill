import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  type ViewStyle,
} from 'react-native';
import { useTheme } from '../foundation/theme';
import { tokens } from '../foundation/tokens';

export interface FilterOption {
  id: string;
  label: string;
  count?: number;
  icon?: string;
}

export interface DiscoveryFiltersProps {
  options: FilterOption[];
  selectedIds: string[];
  onToggle: (id: string) => void;
  onClear?: () => void;
  clearLabel?: string;
  style?: ViewStyle;
}

export function DiscoveryFilters({
  options,
  selectedIds,
  onToggle,
  onClear,
  clearLabel = 'Clear all',
  style,
}: DiscoveryFiltersProps) {
  const { colors } = useTheme();
  const hasActiveFilters =
    selectedIds.length > 0 &&
    !(selectedIds.length === 1 && selectedIds[0] === 'all');

  return (
    <View style={{ width: '100%', maxWidth: '100%', overflow: 'hidden' }}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[styles.container, style]}
      >
      {hasActiveFilters && onClear && (
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel={clearLabel}
          onPress={onClear}
          style={[
            styles.filterPill,
            styles.clearPill,
            { borderColor: colors.border, backgroundColor: colors.surface },
          ]}
        >
          <Text style={[styles.clearIcon, { color: colors.muted }]}>✕</Text>
          <Text style={[styles.pillLabel, { color: colors.muted, fontWeight: '600' }]}>
            {clearLabel}
          </Text>
        </TouchableOpacity>
      )}

      {options.map((option) => {
        const isSelected = selectedIds.includes(option.id);
        const accessibilityLabel = `${option.label}${
          option.count !== undefined ? `, ${option.count} results` : ''
        }`;

        return (
          <TouchableOpacity
            key={option.id}
            accessibilityRole="button"
            accessibilityLabel={accessibilityLabel}
            accessibilityState={{ selected: isSelected }}
            onPress={() => onToggle(option.id)}
            style={[
              styles.filterPill,
              {
                backgroundColor: isSelected ? colors.primary : colors.surface,
                borderColor: isSelected ? colors.primary : colors.border,
              },
            ]}
          >
            {option.icon && (
              <Text
                style={[
                  styles.pillIcon,
                  { color: isSelected ? colors.onPrimary : colors.text },
                ]}
              >
                {option.icon}
              </Text>
            )}
            <Text
              style={[
                styles.pillLabel,
                {
                  color: isSelected ? colors.onPrimary : colors.text,
                  fontWeight: isSelected ? '700' : '500',
                },
              ]}
            >
              {option.label}
            </Text>
            {option.count !== undefined && (
              <View
                style={[
                  styles.countBadge,
                  {
                    backgroundColor: isSelected
                      ? 'rgba(255,255,255,0.25)'
                      : colors.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.countText,
                    {
                      color: isSelected ? colors.onPrimary : colors.muted,
                      fontVariant: ['tabular-nums'],
                    },
                  ]}
                >
                  {option.count}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        );
      })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: tokens.spacing.md,
    gap: tokens.spacing.sm,
    paddingVertical: tokens.spacing.xs,
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
    paddingHorizontal: tokens.spacing.md,
    borderRadius: tokens.radius.full,
    borderWidth: 1,
    gap: 6,
  },
  clearPill: {
    paddingHorizontal: tokens.spacing.sm,
  },
  clearIcon: {
    fontSize: 12,
    fontWeight: '700',
  },
  pillIcon: {
    fontSize: 14,
  },
  pillLabel: {
    fontSize: tokens.typography.small,
  },
  countBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: tokens.radius.full,
  },
  countText: {
    fontSize: 11,
    fontWeight: '600',
  },
});
