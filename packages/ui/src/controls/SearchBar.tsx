import React, { useState } from 'react';
import {
  View,
  TextInput,
  Pressable,
  ActivityIndicator,
  StyleSheet,
  type TextInputProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useTheme } from '../foundation/theme';
import { tokens } from '../foundation/tokens';
import { Text } from '../primitives/Text';

export interface SearchBarProps extends Omit<TextInputProps, 'style'> {
  value: string;
  onChangeText: (text: string) => void;
  onSearch?: (text: string) => void;
  onClear?: () => void;
  placeholder?: string;
  loading?: boolean;
  showCancelButton?: boolean;
  cancelButtonLabel?: string;
  onCancel?: () => void;
  disabled?: boolean;
  label?: string;
  hint?: string;
  style?: StyleProp<ViewStyle>;
}

export function SearchBar({
  value,
  onChangeText,
  onSearch,
  onClear,
  placeholder = 'Search…',
  loading = false,
  showCancelButton = false,
  cancelButtonLabel = 'Cancel',
  onCancel,
  disabled = false,
  label = 'Search',
  hint,
  style,
  autoCapitalize = 'none',
  autoCorrect = false,
  returnKeyType = 'search',
  ...restProps
}: SearchBarProps) {
  const { colors } = useTheme();
  const [isFocused, setIsFocused] = useState(false);

  const handleClear = () => {
    onChangeText('');
    onClear?.();
  };

  const handleCancel = () => {
    onChangeText('');
    onCancel?.();
  };

  const handleSubmit = () => {
    onSearch?.(value);
  };

  const hasValue = value.length > 0;

  return (
    <View style={[styles.root, style]}>
      <View
        style={[
          styles.inputContainer,
          {
            backgroundColor: colors.surface,
            borderColor: isFocused ? colors.primary : colors.border,
          },
          disabled && styles.disabledContainer,
        ]}
      >
        {/* Leading search icon */}
        <View style={styles.leadingIconSlot} pointerEvents="none">
          <Text
            aria-hidden
            style={[styles.searchIcon, { color: isFocused ? colors.primary : colors.muted }]}
          >
            ⌕
          </Text>
        </View>

        {/* Text input */}
        <TextInput
          {...restProps}
          value={value}
          onChangeText={onChangeText}
          onSubmitEditing={handleSubmit}
          onFocus={(e) => {
            setIsFocused(true);
            restProps.onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            restProps.onBlur?.(e);
          }}
          placeholder={placeholder}
          placeholderTextColor={colors.muted}
          editable={!disabled}
          accessibilityRole="search"
          accessibilityLabel={label}
          accessibilityHint={hint}
          autoCapitalize={autoCapitalize}
          autoCorrect={autoCorrect}
          returnKeyType={returnKeyType}
          style={[
            styles.textInput,
            {
              color: colors.text,
            },
          ]}
        />

        {/* Trailing slot: loading indicator or clear button */}
        {loading ? (
          <View style={styles.trailingSlot}>
            <ActivityIndicator size="small" color={colors.primary} />
          </View>
        ) : hasValue && !disabled ? (
          <Pressable
            onPress={handleClear}
            accessibilityRole="button"
            accessibilityLabel={`Clear ${label}`}
            hitSlop={8}
            style={({ pressed }) => [
              styles.clearButton,
              { backgroundColor: colors.border, opacity: pressed ? 0.7 : 1 },
            ]}
          >
            <Text style={[styles.clearIcon, { color: colors.text }]}>✕</Text>
          </Pressable>
        ) : null}
      </View>

      {/* Optional Cancel button */}
      {showCancelButton ? (
        <Pressable
          onPress={handleCancel}
          accessibilityRole="button"
          accessibilityLabel={cancelButtonLabel}
          style={({ pressed }) => [
            styles.cancelButton,
            { opacity: pressed ? 0.6 : 1 },
          ]}
        >
          <Text style={{ color: colors.primary, fontWeight: '600', fontSize: tokens.typography.body }}>
            {cancelButtonLabel}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing.sm,
    width: '100%',
  },
  inputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 44,
    borderRadius: tokens.radius.full,
    borderWidth: 1,
    paddingHorizontal: tokens.spacing.md,
  },
  disabledContainer: {
    opacity: 0.5,
  },
  leadingIconSlot: {
    marginRight: tokens.spacing.xs,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchIcon: {
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 22,
  },
  textInput: {
    flex: 1,
    paddingVertical: tokens.spacing.xs,
    paddingHorizontal: tokens.spacing.xs,
    fontSize: tokens.typography.body,
    minHeight: 40,
  },
  trailingSlot: {
    marginLeft: tokens.spacing.xs,
    justifyContent: 'center',
    alignItems: 'center',
  },
  clearButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: tokens.spacing.xs,
  },
  clearIcon: {
    fontSize: 10,
    fontWeight: '700',
    lineHeight: 12,
  },
  cancelButton: {
    paddingHorizontal: tokens.spacing.xs,
    paddingVertical: tokens.spacing.sm,
    justifyContent: 'center',
  },
});
