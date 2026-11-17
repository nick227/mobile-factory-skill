import React from 'react';
import {
  View,
  Pressable,
  StyleSheet,
  type StyleProp,
  type ViewStyle,
  type AccessibilityActionEvent,
} from 'react-native';
import { useTheme } from '../foundation/theme';
import { Text } from '../primitives/Text';

export interface RatingBarProps {
  value: number;
  onValueChange?: (value: number) => void;
  max?: number;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  showValue?: boolean;
  symbol?: 'star' | 'heart';
  style?: StyleProp<ViewStyle>;
}

export function RatingBar({
  value,
  onValueChange,
  max = 5,
  label = 'Rating',
  size = 'md',
  disabled = false,
  showValue = false,
  symbol = 'star',
  style,
}: RatingBarProps) {
  const { colors, tokens } = useTheme();

  const handleSelect = (index: number) => {
    if (disabled || !onValueChange) return;
    // Tapping the currently selected rating clears to 0 if already selected, or sets to index
    const next = value === index ? 0 : index;
    onValueChange(next);
  };

  const handleAccessibilityAction = (event: AccessibilityActionEvent) => {
    if (disabled || !onValueChange) return;
    if (event.nativeEvent.actionName === 'increment') {
      onValueChange(Math.min(max, value + 1));
    } else if (event.nativeEvent.actionName === 'decrement') {
      onValueChange(Math.max(0, value - 1));
    }
  };

  const filledGlyph = symbol === 'heart' ? '♥' : '★';
  const emptyGlyph = symbol === 'heart' ? '♡' : '☆';

  const iconFontSize = size === 'sm' ? 20 : size === 'lg' ? 36 : 28;
  const touchDimension = size === 'sm' ? 32 : size === 'lg' ? 52 : 44;

  const starElements = Array.from({ length: max }, (_, i) => {
    const starNumber = i + 1;
    const isFilled = starNumber <= Math.round(value);

    return (
      <Pressable
        key={starNumber}
        onPress={() => handleSelect(starNumber)}
        disabled={disabled || !onValueChange}
        accessibilityRole="button"
        accessibilityLabel={`${starNumber} of ${max} ${symbol}s`}
        hitSlop={tokens.spacing.xs}
        style={({ pressed }) => [
          styles.starSlot,
          {
            width: touchDimension,
            height: touchDimension,
            opacity: pressed && !disabled ? 0.7 : 1,
          },
        ]}
      >
        <Text
          style={[
            styles.starGlyph,
            {
              fontSize: iconFontSize,
              color: isFilled ? colors.warning : colors.border,
            },
          ]}
        >
          {isFilled ? filledGlyph : emptyGlyph}
        </Text>
      </Pressable>
    );
  });

  return (
    <View
      style={[styles.root, { gap: tokens.spacing.sm }, style]}
      accessibilityRole="adjustable"
      accessibilityLabel={label}
      accessibilityValue={{
        min: 0,
        max,
        now: value,
        text: `${value} out of ${max} ${symbol}s`,
      }}
      accessibilityActions={
        disabled || !onValueChange
          ? undefined
          : [
              { name: 'increment', label: `Increase ${label}` },
              { name: 'decrement', label: `Decrease ${label}` },
            ]
      }
      onAccessibilityAction={handleAccessibilityAction}
    >
      <View style={styles.starsRow}>{starElements}</View>

      {showValue ? (
        <Text variant="small" style={styles.valueLabel}>
          {value.toFixed(1)}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'flex-start',
  },
  starsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  starSlot: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  starGlyph: {
    textAlign: 'center',
    lineHeight: 32,
  },
  valueLabel: {
    fontWeight: '700',
    minWidth: 28,
  },
});
