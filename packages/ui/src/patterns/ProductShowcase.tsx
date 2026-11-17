import React from 'react';
import { View, TouchableOpacity, StyleSheet, type ViewStyle } from 'react-native';
import { Text } from '../primitives/Text';
import { Badge, type BadgeTone } from '../controls/Badge';
import { Button } from '../controls/Button';
import { MediaFrame } from '../composites/MediaFrame';
import { useTheme } from '../foundation/theme';
import { tokens } from '../foundation/tokens';

export type ProductStockStatus = 'in_stock' | 'low_stock' | 'out_of_stock';

export interface ProductShowcaseProps {
  id: string;
  title: string;
  price: string | number;
  originalPrice?: string | number;
  brand?: string;
  imageUri?: string;
  aspectRatio?: number;
  rating?: number;
  reviewCount?: number;
  stockStatus?: ProductStockStatus;
  stockLabel?: string;
  onAddToCart?: () => void;
  onPress?: () => void;
  addToCartLabel?: string;
  style?: ViewStyle;
}

export function ProductShowcase({
  id,
  title,
  price,
  originalPrice,
  brand,
  imageUri,
  aspectRatio = 4 / 3,
  rating,
  reviewCount,
  stockStatus = 'in_stock',
  stockLabel,
  onAddToCart,
  onPress,
  addToCartLabel = 'Add to Bag',
  style,
}: ProductShowcaseProps) {
  const { colors } = useTheme();

  let stockTone: BadgeTone = 'success';
  let defaultStockLabel = 'In Stock';

  if (stockStatus === 'low_stock') {
    stockTone = 'warning';
    defaultStockLabel = 'Low Stock';
  } else if (stockStatus === 'out_of_stock') {
    stockTone = 'danger';
    defaultStockLabel = 'Sold Out';
  }

  const effectiveStockLabel = stockLabel || defaultStockLabel;
  const isAvailable = stockStatus !== 'out_of_stock';

  const cardContent = (
    <View
      style={[
        styles.cardContainer,
        { backgroundColor: colors.surface, borderColor: colors.border },
        style,
      ]}
      accessible
      accessibilityRole="summary"
      accessibilityLabel={`${title} by ${brand || 'Unknown'}, ${price}, ${effectiveStockLabel}`}
    >
      {/* Product Image */}
      <MediaFrame
        source={imageUri ? { uri: imageUri } : null}
        ratio={aspectRatio}
        label={title}
        radius={tokens.radius.sm}
      />

      {/* Brand & Stock Header */}
      <View style={styles.metaRow}>
        {brand && (
          <Text muted variant="caption" style={{ textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: '700' }}>
            {brand}
          </Text>
        )}
        <Badge label={effectiveStockLabel} tone={stockTone} />
      </View>

      {/* Title */}
      <Text variant="heading" numberOfLines={2} style={styles.titleText}>
        {title}
      </Text>

      {/* Rating & Review summary */}
      {rating !== undefined && (
        <View style={styles.ratingRow}>
          <Text style={{ color: colors.warning, fontSize: 13, fontWeight: '700' }}>
            ★ {rating.toFixed(1)}
          </Text>
          {reviewCount !== undefined && (
            <Text muted variant="caption">
              ({reviewCount} reviews)
            </Text>
          )}
        </View>
      )}

      {/* Price & Action Row */}
      <View style={styles.priceActionRow}>
        <View style={styles.priceCol}>
          <View style={styles.priceGroup}>
            <Text variant="heading" tabular style={{ fontWeight: '700' }}>
              {price}
            </Text>
            {originalPrice && (
              <Text
                muted
                variant="small"
                tabular
                style={{ textDecorationLine: 'line-through', marginTop: 2 }}
              >
                {originalPrice}
              </Text>
            )}
          </View>
        </View>

        {onAddToCart && (
          <Button
            label={addToCartLabel}
            onPress={onAddToCart}
            disabled={!isAvailable}
            size="sm"
          />
        )}
      </View>
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={title}
        activeOpacity={0.85}
      >
        {cardContent}
      </TouchableOpacity>
    );
  }

  return cardContent;
}

const styles = StyleSheet.create({
  cardContainer: {
    borderRadius: tokens.radius.md,
    borderWidth: 1,
    padding: tokens.spacing.md,
    gap: tokens.spacing.sm,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: tokens.spacing.xs,
  },
  titleText: {
    lineHeight: 22,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing.xs,
  },
  priceActionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: tokens.spacing.xs,
  },
  priceCol: {
    flex: 1,
  },
  priceGroup: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: tokens.spacing.sm,
  },
});
