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
import { tokens } from '../foundation/tokens';
import { Text } from '../primitives/Text';

export interface StepperProps {
  value: number;
  onValueChange: (value: number) => void;
  label: string;
  min?: number;
  max?: number;
  step?: number;
  formatValue?: (value: number) => string;
  disabled?: boolean;
  size?: 'sm' | 'md';
  style?: StyleProp<ViewStyle>;
}

export function Stepper({
  value,
  onValueChange,
  label,
  min = 0,
  max = 100,
  step = 1,
  formatValue,
  disabled = false,
  size = 'md',
  style,
}: StepperProps) {
  const { colors } = useTheme();

  const canDecrement = !disabled && value > min;
  const canIncrement = !disabled && value < max;

  const handleDecrement = () => {
    if (canDecrement) {
      const next = Math.max(min, value - step);
      onValueChange(next);
    }
  };

  const handleIncrement = () => {
    if (canIncrement) {
      const next = Math.min(max, value + step);
      onValueChange(next);
    }
  };

  const handleAccessibilityAction = (event: AccessibilityActionEvent) => {
    if (disabled) return;
    if (event.nativeEvent.actionName === 'increment') {
      handleIncrement();
    } else if (event.nativeEvent.actionName === 'decrement') {
      handleDecrement();
    }
  };

  const formattedText = formatValue ? formatValue(value) : String(value);

  const isSmall = size === 'sm';
  const buttonDimension = isSmall ? 36 : 44;
  const valueMinWidth = isSmall ? 32 : 44;

  return (
    <View
      style={[
        styles.root,
        {
          borderColor: colors.border,
          backgroundColor: colors.surface,
          borderRadius: tokens.radius.md,
        },
        disabled && styles.disabledRoot,
        style,
      ]}
      accessibilityRole="adjustable"
      accessibilityLabel={label}
      accessibilityValue={{
        min,
        max,
        now: value,
        text: formattedText,
      }}
      accessibilityActions={[
        { name: 'increment', label: `Increase ${label}` },
        { name: 'decrement', label: `Decrease ${label}` },
      ]}
      onAccessibilityAction={handleAccessibilityAction}
    >
      {/* Decrement button */}
      <Pressable
        onPress={handleDecrement}
        disabled={!canDecrement}
        accessibilityRole="button"
        accessibilityLabel={`Decrease ${label}`}
        accessibilityState={{ disabled: !canDecrement }}
        hitSlop={tokens.spacing.xs}
        style={({ pressed }) => [
          styles.button,
          {
            width: buttonDimension,
            height: buttonDimension,
            borderRadius: tokens.radius.sm,
            backgroundColor: pressed && canDecrement ? colors.border : 'transparent',
            opacity: canDecrement ? 1 : 0.35,
          },
        ]}
      >
        <Text
          style={[
            styles.buttonGlyph,
            {
              color: canDecrement ? colors.text : colors.muted,
              fontSize: isSmall ? 18 : 22,
            },
          ]}
        >
          −
        </Text>
      </Pressable>

      {/* Value display */}
      <View style={[styles.valueSlot, { minWidth: valueMinWidth }]}>
        <Text
          style={[
            styles.valueText,
            {
              color: disabled ? colors.muted : colors.text,
              fontSize: isSmall ? tokens.typography.small : tokens.typography.body,
            },
          ]}
        >
          {formattedText}
        </Text>
      </View>

      {/* Increment button */}
      <Pressable
        onPress={handleIncrement}
        disabled={!canIncrement}
        accessibilityRole="button"
        accessibilityLabel={`Increase ${label}`}
        accessibilityState={{ disabled: !canIncrement }}
        hitSlop={tokens.spacing.xs}
        style={({ pressed }) => [
          styles.button,
          {
            width: buttonDimension,
            height: buttonDimension,
            borderRadius: tokens.radius.sm,
            backgroundColor: pressed && canIncrement ? colors.border : 'transparent',
            opacity: canIncrement ? 1 : 0.35,
          },
        ]}
      >
        <Text
          style={[
            styles.buttonGlyph,
            {
              color: canIncrement ? colors.text : colors.muted,
              fontSize: isSmall ? 18 : 22,
            },
          ]}
        >
          +
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    padding: tokens.spacing.xs,
    alignSelf: 'flex-start',
  },
  disabledRoot: {
    opacity: 0.5,
  },
  button: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonGlyph: {
    fontWeight: '700',
    lineHeight: 22,
    textAlign: 'center',
  },
  valueSlot: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: tokens.spacing.sm,
  },
  valueText: {
    fontWeight: '700',
    textAlign: 'center',
  },
});
