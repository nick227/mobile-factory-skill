import React from 'react';
import { View, Pressable, type ViewStyle, type StyleProp } from 'react-native';
import type { ImageSource } from 'expo-image';
import { useTheme } from '../foundation/theme';
import { geometry, tokens } from '../foundation/tokens';
import { Text } from '../primitives/Text';
import { Badge } from '../controls/Badge';
import { MediaFrame } from '../composites/MediaFrame';

export type ChoiceSelectionMode = 'single' | 'multiple';

export interface ChoiceOption {
  id: string;
  title: string;
  description?: string;
  image?: ImageSource | string | number | null;
  icon?: React.ReactNode;
  badge?: string;
  badgeTone?: 'neutral' | 'accent';
  disabled?: boolean;
}

export interface ChoiceGalleryProps {
  options: readonly ChoiceOption[];
  selected: string | readonly string[];
  onSelect: (selectedId: string, updatedSelection: string[]) => void;
  mode?: ChoiceSelectionMode;
  columns?: number;
  layout?: 'grid' | 'stack';
  label?: string;
  helperText?: string;
  error?: string;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function ChoiceGallery({
  options,
  selected,
  onSelect,
  mode = 'single',
  columns = 2,
  layout = 'grid',
  label,
  helperText,
  error,
  disabled = false,
  style,
}: ChoiceGalleryProps) {
  const { colors } = useTheme();

  const selectedList: string[] = Array.isArray(selected)
    ? (selected as string[])
    : typeof selected === 'string' && selected.length > 0
    ? [selected]
    : [];

  const handlePress = (optionId: string, optionDisabled?: boolean) => {
    if (disabled || optionDisabled) return;

    let nextSelection: string[];
    if (mode === 'single') {
      nextSelection = [optionId];
    } else {
      if (selectedList.includes(optionId)) {
        nextSelection = selectedList.filter((id) => id !== optionId);
      } else {
        nextSelection = [...selectedList, optionId];
      }
    }
    onSelect(optionId, nextSelection);
  };

  const isGrid = layout === 'grid';
  const numColumns = isGrid ? Math.max(1, Math.min(3, columns)) : 1;

  // Render cards in columns if grid
  const columnBuckets: ChoiceOption[][] = Array.from({ length: numColumns }, () => []);
  options.forEach((opt, idx) => {
    columnBuckets[idx % numColumns].push(opt);
  });

  return (
    <View
      style={[{ width: '100%', gap: 12 }, style]}
      accessibilityRole={mode === 'single' ? 'radiogroup' : 'none'}
      accessibilityLabel={label}
    >
      {label ? (
        <Text variant="heading" style={{ fontSize: 16 }}>
          {label}
        </Text>
      ) : null}

      <View style={{ flexDirection: isGrid ? 'row' : 'column', gap: 10 }}>
        {columnBuckets.map((colOptions, colIdx) => (
          <View key={`col-${colIdx}`} style={{ flex: 1, gap: 10 }}>
            {colOptions.map((option) => {
              const isSelected = selectedList.includes(option.id);
              const isDisabled = disabled || Boolean(option.disabled);

              return (
                <Pressable
                  key={option.id}
                  onPress={() => handlePress(option.id, option.disabled)}
                  disabled={isDisabled}
                  accessibilityRole={mode === 'single' ? 'radio' : 'checkbox'}
                  accessibilityState={{ checked: isSelected, disabled: isDisabled }}
                  accessibilityLabel={`${option.title}${option.description ? `, ${option.description}` : ''}${isSelected ? ', selected' : ''}`}
                  style={({ pressed }) => ({
                    borderRadius: tokens.radius.md,
                    backgroundColor: colors.surface,
                    borderWidth: isSelected ? 2 : 1,
                    borderColor: isSelected ? colors.primary : colors.border,
                    overflow: 'hidden',
                    opacity: isDisabled ? 0.45 : pressed ? 0.85 : 1,
                  })}
                >
                  {/* Image / Header Media */}
                  {option.image ? (
                    <View style={{ position: 'relative' }}>
                      <MediaFrame
                        source={option.image}
                        ratio={isGrid ? 1 : 16 / 9}
                        radius={0}
                        label={option.title}
                      />
                      {option.badge ? (
                        <View style={{ position: 'absolute', top: 8, left: 8, zIndex: 1 }}>
                          <Badge label={option.badge} tone={option.badgeTone ?? 'neutral'} />
                        </View>
                      ) : null}
                    </View>
                  ) : null}

                  {/* Body Content */}
                  <View style={{ padding: 12, gap: 4 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                      <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        {option.icon ? <View>{option.icon}</View> : null}
                        <Text
                          variant="heading"
                          numberOfLines={2}
                          style={{
                            fontSize: 15,
                            fontWeight: isSelected ? '700' : '600',
                            color: isSelected ? colors.primary : colors.text,
                          }}
                        >
                          {option.title}
                        </Text>
                      </View>

                      {/* Selection Indicator Check */}
                      <View
                        style={{
                          width: 20,
                          height: 20,
                          borderRadius: mode === 'single' ? 10 : 4,
                          borderWidth: isSelected ? 0 : 1.5,
                          borderColor: colors.border,
                          backgroundColor: isSelected ? colors.primary : 'transparent',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {isSelected ? (
                          <Text style={{ color: colors.onPrimary, fontSize: 12, fontWeight: '700', lineHeight: 14 }}>
                            ✓
                          </Text>
                        ) : null}
                      </View>
                    </View>

                    {option.description ? (
                      <Text muted variant="small" numberOfLines={2} style={{ marginTop: 2 }}>
                        {option.description}
                      </Text>
                    ) : null}

                    {!option.image && option.badge ? (
                      <View style={{ marginTop: 6, alignSelf: 'flex-start' }}>
                        <Badge label={option.badge} tone={option.badgeTone ?? 'neutral'} />
                      </View>
                    ) : null}
                  </View>
                </Pressable>
              );
            })}
          </View>
        ))}
      </View>

      {error ? (
        <Text style={{ color: colors.danger, fontSize: 13, marginTop: 2 }}>
          {error}
        </Text>
      ) : helperText ? (
        <Text muted variant="small" style={{ marginTop: 2 }}>
          {helperText}
        </Text>
      ) : null}
    </View>
  );
}
