import React, { useRef, useState } from 'react';
import {
  View,
  TextInput,
  Pressable,
  StyleSheet,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useTheme } from '../foundation/theme';
import { tokens } from '../foundation/tokens';
import { Text } from '../primitives/Text';

export interface PinInputProps {
  value: string;
  onChange: (value: string) => void;
  length?: number;
  mask?: boolean;
  disabled?: boolean;
  error?: string;
  label?: string;
  hint?: string;
  autoFocus?: boolean;
  onComplete?: (code: string) => void;
  style?: StyleProp<ViewStyle>;
}

export function PinInput({
  value,
  onChange,
  length = 6,
  mask = false,
  disabled = false,
  error,
  label = 'Verification code',
  hint,
  autoFocus = false,
  onComplete,
  style,
}: PinInputProps) {
  const { colors } = useTheme();
  const inputRef = useRef<any>(null);
  const [isFocused, setIsFocused] = useState(false);

  const cleanValue = value.replace(/[^0-9]/g, '').slice(0, length);

  const handleChangeText = (text: string) => {
    const sanitized = text.replace(/[^0-9]/g, '').slice(0, length);
    onChange(sanitized);
    if (sanitized.length === length) {
      onComplete?.(sanitized);
    }
  };

  const handleCellPress = () => {
    if (!disabled) {
      inputRef.current?.focus();
    }
  };

  const cells = Array.from({ length }, (_, index) => {
    const digit = cleanValue[index];
    const isCurrent = isFocused && index === cleanValue.length;
    const isFilled = digit !== undefined;

    return (
      <View
        key={index}
        style={[
          styles.cell,
          {
            backgroundColor: colors.surface,
            borderColor: error
              ? colors.danger
              : isCurrent
              ? colors.primary
              : isFilled
              ? colors.text
              : colors.border,
            borderWidth: isCurrent ? 2 : 1,
          },
          disabled && styles.disabledCell,
        ]}
      >
        <Text
          style={[
            styles.digitText,
            { color: colors.text },
          ]}
        >
          {digit ? (mask ? '•' : digit) : ''}
        </Text>
      </View>
    );
  });

  return (
    <View style={[styles.root, style]}>
      {label ? (
        <Text variant="small" style={styles.label}>
          {label}
        </Text>
      ) : null}

      <Pressable
        onPress={handleCellPress}
        accessibilityRole="none"
        accessibilityLabel={`${label}, ${cleanValue.length} of ${length} digits entered`}
        style={styles.cellsRow}
      >
        {cells}
      </Pressable>

      {/* Hidden real TextInput that handles keyboard, paste, and text composition */}
      <TextInput
        ref={inputRef}
        value={cleanValue}
        onChangeText={handleChangeText}
        keyboardType="number-pad"
        maxLength={length}
        autoFocus={autoFocus}
        editable={!disabled}
        textContentType="oneTimeCode"
        autoComplete="one-time-code"
        accessibilityLabel={label}
        accessibilityHint={hint}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        style={styles.hiddenInput}
        caretHidden
      />

      {error ? (
        <Text variant="small" accessibilityRole="alert" style={{ color: colors.danger }}>
          {error}
        </Text>
      ) : hint ? (
        <Text variant="small" muted>
          {hint}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: tokens.spacing.xs,
    width: '100%',
  },
  label: {
    fontWeight: '700',
  },
  cellsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing.sm,
    justifyContent: 'center',
    paddingVertical: tokens.spacing.xs,
  },
  cell: {
    width: 44,
    height: 52,
    borderRadius: tokens.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledCell: {
    opacity: 0.5,
  },
  digitText: {
    fontSize: tokens.typography.title,
    fontWeight: '700',
    textAlign: 'center',
  },
  hiddenInput: {
    position: 'absolute',
    width: 1,
    height: 1,
    opacity: 0.01,
  },
});
