import React, { useState } from 'react';
import { View, Pressable, Modal, FlatList, type ViewStyle, type StyleProp } from 'react-native';
import { useTheme } from '../foundation/theme';
import { tokens, geometry } from '../foundation/tokens';
import { Text } from '../primitives/Text';

export interface SelectOption {
  label: string;
  value: string;
  disabled?: boolean;
}

export interface SelectProps {
  label?: string;
  value?: string;
  onValueChange: (value: string) => void;
  options: readonly SelectOption[];
  placeholder?: string;
  error?: string;
  hint?: string;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function Select({
  label,
  value,
  onValueChange,
  options,
  placeholder = 'Select an option',
  error,
  hint,
  disabled = false,
  style,
}: SelectProps) {
  const { colors } = useTheme();
  const [modalVisible, setModalVisible] = useState(false);

  const selectedOption = options.find((o) => o.value === value);
  const displayText = selectedOption ? selectedOption.label : placeholder;
  const isSelected = Boolean(selectedOption);

  const handleSelect = (optionValue: string) => {
    onValueChange(optionValue);
    setModalVisible(false);
  };

  return (
    <View style={[{ gap: 6, width: '100%' }, style]}>
      {label ? (
        <Text variant="heading" style={{ fontSize: 14 }}>
          {label}
        </Text>
      ) : null}

      <Pressable
        onPress={() => !disabled && setModalVisible(true)}
        accessibilityRole="combobox"
        accessibilityLabel={label ? `${label}, ${displayText}` : displayText}
        accessibilityState={{ disabled, expanded: modalVisible }}
        accessibilityValue={{ text: displayText }}
        disabled={disabled}
        style={({ pressed }) => ({
          minHeight: geometry.inputHeight,
          borderRadius: tokens.radius.md,
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: error ? colors.danger : colors.border,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: tokens.spacing.md,
          opacity: disabled ? 0.45 : pressed ? 0.85 : 1,
        })}
      >
        <Text
          style={{
            fontSize: 15,
            color: isSelected ? colors.text : colors.muted,
          }}
          numberOfLines={1}
        >
          {displayText}
        </Text>

        <Text style={{ fontSize: 13, color: colors.muted, marginLeft: 8 }}>
          ▼
        </Text>
      </Pressable>

      {error ? (
        <Text style={{ color: colors.danger, fontSize: 12 }}>{error}</Text>
      ) : hint ? (
        <Text muted variant="small">
          {hint}
        </Text>
      ) : null}

      {/* Options Selection Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable
          style={{
            flex: 1,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            justifyContent: 'center',
            alignItems: 'center',
            padding: 20,
          }}
          onPress={() => setModalVisible(false)}
        >
          <Pressable
            style={{
              width: '100%',
              maxWidth: 380,
              maxHeight: 460,
              backgroundColor: colors.background,
              borderRadius: tokens.radius.lg,
              borderWidth: 1,
              borderColor: colors.border,
              overflow: 'hidden',
              padding: tokens.spacing.md,
              gap: 8,
            }}
            onPress={(e) => e.stopPropagation()}
          >
            {label ? (
              <View style={{ paddingHorizontal: 8, paddingVertical: 4 }}>
                <Text variant="heading" style={{ fontSize: 16 }}>
                  {label}
                </Text>
              </View>
            ) : null}

            <FlatList
              data={options as SelectOption[]}
              keyExtractor={(item) => item.value}
              renderItem={({ item }) => {
                const active = item.value === value;
                return (
                  <Pressable
                    onPress={() => !item.disabled && handleSelect(item.value)}
                    disabled={item.disabled}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active, disabled: Boolean(item.disabled) }}
                    accessibilityLabel={item.label}
                    style={({ pressed }) => ({
                      minHeight: 48,
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      paddingHorizontal: 12,
                      paddingVertical: 10,
                      borderRadius: tokens.radius.sm,
                      backgroundColor: active ? colors.surface : 'transparent',
                      opacity: item.disabled ? 0.4 : pressed ? 0.8 : 1,
                    })}
                  >
                    <Text
                      style={{
                        fontSize: 15,
                        fontWeight: active ? '700' : '500',
                        color: active ? colors.primary : colors.text,
                      }}
                    >
                      {item.label}
                    </Text>

                    {active ? (
                      <Text style={{ color: colors.primary, fontWeight: '700', fontSize: 16 }}>
                        ✓
                      </Text>
                    ) : null}
                  </Pressable>
                );
              }}
            />

            <Pressable
              onPress={() => setModalVisible(false)}
              accessibilityRole="button"
              accessibilityLabel="Cancel"
              style={{
                minHeight: 44,
                alignItems: 'center',
                justifyContent: 'center',
                marginTop: 6,
                borderTopWidth: 1,
                borderColor: colors.border,
                paddingTop: 8,
              }}
            >
              <Text style={{ color: colors.muted, fontWeight: '600', fontSize: 14 }}>
                Cancel
              </Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
