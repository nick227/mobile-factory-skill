import React from 'react';
import { View, Pressable, type ViewStyle, type StyleProp } from 'react-native';
import type { ImageSource } from 'expo-image';
import { useTheme } from '../foundation/theme';
import { Text } from '../primitives/Text';
import { Badge } from '../controls/Badge';
import { MediaFrame } from '../composites/MediaFrame';

export interface EditorialMosaicItem {
  id: string;
  title: string;
  subtitle?: string;
  image?: ImageSource | string | number | null;
  aspectRatio?: number;
  badge?: string;
  badgeTone?: 'neutral' | 'accent';
  metadata?: string;
}

export type EditorialMosaicDensity = 'compact' | 'comfortable' | 'spacious';

export interface EditorialMosaicProps {
  items: readonly EditorialMosaicItem[];
  columns?: number;
  density?: EditorialMosaicDensity;
  onItemPress?: (item: EditorialMosaicItem) => void;
  emptyState?: React.ReactNode;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}

const densityGaps: Record<EditorialMosaicDensity, number> = {
  compact: 8,
  comfortable: 12,
  spacious: 16,
};

export function EditorialMosaic({
  items,
  columns = 2,
  density = 'comfortable',
  onItemPress,
  emptyState,
  header,
  footer,
  style,
  accessibilityLabel = 'Editorial mosaic',
}: EditorialMosaicProps) {
  const { colors } = useTheme();
  const gap = densityGaps[density] ?? 12;
  const numColumns = Math.max(1, Math.min(4, columns));

  if (!items || items.length === 0) {
    if (emptyState) return <View style={style}>{emptyState}</View>;
    return null;
  }

  const columnBuckets: EditorialMosaicItem[][] = Array.from({ length: numColumns }, () => []);
  const columnHeights = new Array(numColumns).fill(0);

  items.forEach((item) => {
    let shortestCol = 0;
    for (let i = 1; i < numColumns; i++) {
      if (columnHeights[i] < columnHeights[shortestCol]) {
        shortestCol = i;
      }
    }
    columnBuckets[shortestCol].push(item);
    const ratio = typeof item.aspectRatio === 'number' && item.aspectRatio > 0 ? item.aspectRatio : 1;
    columnHeights[shortestCol] += (1 / ratio) + 0.35;
  });

  return (
    <View style={[{ width: '100%' }, style]} accessibilityLabel={accessibilityLabel}>
      {header ? <View style={{ marginBottom: gap }}>{header}</View> : null}

      <View style={{ flexDirection: 'row', gap }}>
        {columnBuckets.map((colItems, colIdx) => (
          <View key={`col-${colIdx}`} style={{ flex: 1, gap }}>
            {colItems.map((item) => {
              const itemRatio = typeof item.aspectRatio === 'number' && item.aspectRatio > 0 ? item.aspectRatio : 1;
              const hasText = Boolean(item.title || item.subtitle || item.metadata);

              return (
                <Pressable
                  key={item.id}
                  onPress={() => onItemPress?.(item)}
                  accessibilityRole="button"
                  accessibilityLabel={`${item.title}${item.subtitle ? `, ${item.subtitle}` : ''}`}
                  style={({ pressed }) => ({
                    borderRadius: 14,
                    backgroundColor: colors.surface,
                    overflow: 'hidden',
                    borderWidth: 1,
                    borderColor: colors.border,
                    opacity: pressed ? 0.85 : 1,
                  })}
                >
                  <View style={{ position: 'relative' }}>
                    <MediaFrame
                      source={item.image}
                      ratio={itemRatio}
                      radius={0}
                      label={item.title}
                    />
                    {item.badge ? (
                      <View
                        style={{
                          position: 'absolute',
                          top: 8,
                          left: 8,
                          zIndex: 1,
                        }}
                      >
                        <Badge label={item.badge} tone={item.badgeTone ?? 'neutral'} />
                      </View>
                    ) : null}
                  </View>

                  {hasText ? (
                    <View style={{ padding: gap }}>
                      {item.title ? (
                        <Text variant="heading" numberOfLines={2} style={{ fontSize: 15, lineHeight: 20 }}>
                          {item.title}
                        </Text>
                      ) : null}
                      {item.subtitle ? (
                        <Text muted variant="small" numberOfLines={2} style={{ marginTop: 2 }}>
                          {item.subtitle}
                        </Text>
                      ) : null}
                      {item.metadata ? (
                        <Text muted variant="small" style={{ marginTop: 4, fontSize: 11 }}>
                          {item.metadata}
                        </Text>
                      ) : null}
                    </View>
                  ) : null}
                </Pressable>
              );
            })}
          </View>
        ))}
      </View>

      {footer ? <View style={{ marginTop: gap }}>{footer}</View> : null}
    </View>
  );
}
