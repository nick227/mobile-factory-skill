import React from 'react';
import { View, Pressable, type ViewStyle, type StyleProp } from 'react-native';
import { useTheme } from '../foundation/theme';
import { tokens } from '../foundation/tokens';
import { Text } from '../primitives/Text';
import { Divider } from '../primitives/Divider';

export interface AccordionItem {
  id: string;
  title: string;
  subtitle?: string;
  content: React.ReactNode;
  disabled?: boolean;
}

export interface AccordionProps {
  items: readonly AccordionItem[];
  expandedIds: readonly string[];
  onToggle: (id: string) => void;
  style?: StyleProp<ViewStyle>;
}

export function Accordion({
  items,
  expandedIds,
  onToggle,
  style,
}: AccordionProps) {
  const { colors } = useTheme();

  return (
    <View
      style={[
        {
          width: '100%',
          borderRadius: tokens.radius.md,
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.border,
          overflow: 'hidden',
        },
        style,
      ]}
    >
      {items.map((item, index) => {
        const isExpanded = expandedIds.includes(item.id);
        const isDisabled = Boolean(item.disabled);

        return (
          <View key={item.id}>
            {index > 0 ? <Divider /> : null}

            <Pressable
              onPress={() => !isDisabled && onToggle(item.id)}
              disabled={isDisabled}
              accessibilityRole="button"
              accessibilityLabel={`${item.title}${item.subtitle ? `, ${item.subtitle}` : ''}`}
              accessibilityState={{ expanded: isExpanded, disabled: isDisabled }}
              style={({ pressed }) => ({
                minHeight: 52,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingHorizontal: 16,
                paddingVertical: 12,
                backgroundColor: isExpanded ? colors.background : 'transparent',
                opacity: isDisabled ? 0.45 : pressed ? 0.85 : 1,
              })}
            >
              <View style={{ flex: 1, gap: 2 }}>
                <Text
                  variant="heading"
                  style={{
                    fontSize: 15,
                    fontWeight: isExpanded ? '700' : '600',
                    color: isExpanded ? colors.primary : colors.text,
                  }}
                >
                  {item.title}
                </Text>
                {item.subtitle ? (
                  <Text muted variant="small">
                    {item.subtitle}
                  </Text>
                ) : null}
              </View>

              <Text
                style={{
                  fontSize: 12,
                  fontWeight: '700',
                  color: isExpanded ? colors.primary : colors.muted,
                  marginLeft: 8,
                }}
              >
                {isExpanded ? '▲' : '▼'}
              </Text>
            </Pressable>

            {isExpanded ? (
              <View
                style={{
                  paddingHorizontal: 16,
                  paddingBottom: 16,
                  paddingTop: 8,
                  backgroundColor: colors.background,
                }}
              >
                {item.content}
              </View>
            ) : null}
          </View>
        );
      })}
    </View>
  );
}
