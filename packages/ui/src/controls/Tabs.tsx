import React from 'react';
import { View, Pressable, type ViewStyle, type StyleProp } from 'react-native';
import { useTheme } from '../foundation/theme';
import { tokens } from '../foundation/tokens';
import { Text } from '../primitives/Text';

export interface TabItem {
  id: string;
  label: string;
  badge?: string;
  disabled?: boolean;
}

export interface TabsProps {
  tabs: readonly TabItem[];
  value: string;
  onValueChange: (value: string) => void;
  variant?: 'pill' | 'underline';
  style?: StyleProp<ViewStyle>;
}

export function Tabs({
  tabs,
  value,
  onValueChange,
  variant = 'pill',
  style,
}: TabsProps) {
  const { colors } = useTheme();

  return (
    <View
      accessibilityRole="tablist"
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: variant === 'pill' ? colors.surface : 'transparent',
          borderRadius: variant === 'pill' ? tokens.radius.md : 0,
          padding: variant === 'pill' ? 4 : 0,
          borderBottomWidth: variant === 'underline' ? 1 : 0,
          borderColor: colors.border,
          gap: 4,
        },
        style,
      ]}
    >
      {tabs.map((tab) => {
        const active = tab.id === value;

        return (
          <Pressable
            key={tab.id}
            onPress={() => !tab.disabled && onValueChange(tab.id)}
            disabled={tab.disabled}
            accessibilityRole="tab"
            accessibilityLabel={tab.badge ? `${tab.label}, ${tab.badge}` : tab.label}
            accessibilityState={{ selected: active, disabled: Boolean(tab.disabled) }}
            style={({ pressed }) => ({
              flex: 1,
              minHeight: 44,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: variant === 'pill' ? tokens.radius.sm : 0,
              backgroundColor:
                variant === 'pill'
                  ? active
                    ? colors.background
                    : 'transparent'
                  : 'transparent',
              borderBottomWidth: variant === 'underline' ? (active ? 2 : 0) : 0,
              borderColor: colors.primary,
              paddingHorizontal: 8,
              paddingVertical: 6,
              opacity: tab.disabled ? 0.4 : pressed ? 0.8 : 1,
              gap: 6,
            })}
          >
            <Text
              style={{
                fontSize: 14,
                fontWeight: active ? '700' : '500',
                color: active ? colors.primary : colors.text,
              }}
            >
              {tab.label}
            </Text>

            {tab.badge ? (
              <View
                style={{
                  backgroundColor: active ? colors.primary : colors.border,
                  borderRadius: 10,
                  paddingHorizontal: 6,
                  paddingVertical: 1,
                }}
              >
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: '700',
                    color: active ? colors.onPrimary : colors.muted,
                  }}
                >
                  {tab.badge}
                </Text>
              </View>
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}
