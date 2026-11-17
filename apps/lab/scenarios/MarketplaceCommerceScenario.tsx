import React, { useState } from 'react';
import { View, ScrollView } from 'react-native';
import {
  Text,
  Stack,
  Row,
  Surface,
  Button,
  ScreenHeader,
  DiscoveryFilters,
  ProductShowcase,
  SelectionDock,
  Dialog,
  useTheme,
  tokens,
} from '@factory/ui';

interface CartItem {
  id: string;
  title: string;
  priceNum: number;
}

export function MarketplaceCommerceScenario() {
  const { colors } = useTheme();
  const [selectedCategory, setSelectedCategory] = useState<string[]>(['all']);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [purchased, setPurchased] = useState(false);

  const categories = [
    { id: 'all', label: 'All Artifacts', count: 18 },
    { id: 'ceramics', label: 'Kyoto Ceramics', count: 6 },
    { id: 'woodwork', label: 'Yoshino Cedar', count: 5 },
    { id: 'tea', label: 'Tea Utensils', count: 4 },
    { id: 'textiles', label: 'Nishijin Weaving', count: 3 },
  ];

  const products = [
    {
      id: 'prod-1',
      brand: 'Kihara Pottery',
      title: 'Arita Ware Hand-Glazed Celadon Matcha Bowl',
      price: '$120.00',
      priceNum: 120,
      originalPrice: '$145.00',
      imageUri: 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=800&q=80',
      rating: 4.9,
      reviewCount: 48,
      stockStatus: 'in_stock' as const,
      category: 'ceramics',
    },
    {
      id: 'prod-2',
      brand: 'Nakagawa Mokkougei',
      title: 'Precision Curved Sawara Wood Champagne Cooler',
      price: '$380.00',
      priceNum: 380,
      imageUri: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=800&q=80',
      rating: 5.0,
      reviewCount: 16,
      stockStatus: 'low_stock' as const,
      stockLabel: 'Only 1 left',
      category: 'woodwork',
    },
    {
      id: 'prod-3',
      brand: 'Kaikado',
      title: 'Handmade Hammered Tin Chazutsu Tea Caddy',
      price: '$175.00',
      priceNum: 175,
      originalPrice: '$195.00',
      imageUri: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=800&q=80',
      rating: 4.8,
      reviewCount: 82,
      stockStatus: 'in_stock' as const,
      category: 'tea',
    },
    {
      id: 'prod-4',
      brand: 'Hosoo Kyoto',
      title: 'Kinran Gold Leaf Silk Tapestry Cushion',
      price: '$210.00',
      priceNum: 210,
      imageUri: 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=800&q=80',
      rating: 4.7,
      reviewCount: 24,
      stockStatus: 'in_stock' as const,
      category: 'textiles',
    },
  ];

  const filteredProducts = products.filter((p) => {
    if (selectedCategory.includes('all')) return true;
    return selectedCategory.includes(p.category);
  });

  const handleAddToCart = (product: { id: string; title: string; priceNum: number }) => {
    setCart((prev) => [...prev, { id: product.id, title: product.title, priceNum: product.priceNum }]);
  };

  const totalAmount = cart.reduce((sum, item) => sum + item.priceNum, 0);

  if (purchased) {
    return (
      <Stack gap="lg">
        <ScreenHeader title="Order Confirmed" />
        <Surface outlined>
          <Stack gap="md">
            <Text variant="title">Thank you for supporting Kyoto craft</Text>
            <Text>
              Your order for {cart.length} handcrafted items totaling{' '}
              <Text style={{ fontWeight: '700' }}>${totalAmount}.00</Text> has been
              received. Studio artisans will begin careful wooden-box packaging.
            </Text>
          </Stack>
        </Surface>
        <Button
          label="Return to Marketplace"
          fullWidth
          onPress={() => {
            setPurchased(false);
            setCart([]);
          }}
        />
      </Stack>
    );
  }

  return (
    <View style={{ paddingBottom: cart.length > 0 ? 80 : 0 }}>
      <Stack gap="md">
        <ScreenHeader
          title="Artisan Marketplace"
          subtitle="Direct acquisitions from verified Kyoto master studios"
        />

        {/* Category discovery filters */}
        <DiscoveryFilters
          options={categories}
          selectedIds={selectedCategory}
          onToggle={(id) => {
            if (id === 'all') setSelectedCategory(['all']);
            else {
              const next = selectedCategory.includes(id)
                ? selectedCategory.filter((x) => x !== id)
                : [...selectedCategory.filter((x) => x !== 'all'), id];
              setSelectedCategory(next.length === 0 ? ['all'] : next);
            }
          }}
          onClear={() => setSelectedCategory(['all'])}
        />

        {/* Product List */}
        <Stack gap="md">
          {filteredProducts.map((prod) => (
            <ProductShowcase
              key={prod.id}
              id={prod.id}
              brand={prod.brand}
              title={prod.title}
              price={prod.price}
              originalPrice={prod.originalPrice}
              imageUri={prod.imageUri}
              rating={prod.rating}
              reviewCount={prod.reviewCount}
              stockStatus={prod.stockStatus}
              stockLabel={prod.stockLabel}
              onAddToCart={() => handleAddToCart(prod)}
              addToCartLabel="Add to Bag"
            />
          ))}
        </Stack>
      </Stack>

      {/* Floating Selection / Cart Dock */}
      <SelectionDock
        visible={cart.length > 0}
        selectedCount={cart.length}
        title={`${cart.length} items in bag · $${totalAmount}.00`}
        primaryAction={{
          label: 'Proceed to Checkout',
          onPress: () => setCheckoutOpen(true),
        }}
        onClear={() => setCart([])}
        clearLabel="Empty Bag"
      />

      {/* Checkout Dialog */}
      <Dialog
        open={checkoutOpen}
        onOpenChange={setCheckoutOpen}
        title="Confirm Acquisition"
        description={`Place acquisition order for ${cart.length} items totaling $${totalAmount}.00 USD?`}
        primaryAction={{
          label: `Pay $${totalAmount}.00`,
          onPress: () => {
            setCheckoutOpen(false);
            setPurchased(true);
          },
        }}
        secondaryAction={{
          label: 'Continue Shopping',
          onPress: () => setCheckoutOpen(false),
        }}
      >
        <Stack gap="xs" style={{ marginVertical: tokens.spacing.sm }}>
          {cart.map((item, idx) => (
            <Row key={idx} style={{ justifyContent: 'space-between' }}>
              <Text variant="small" numberOfLines={1} style={{ flex: 1 }}>
                {item.title}
              </Text>
              <Text variant="small" tabular style={{ fontWeight: '600' }}>
                ${item.priceNum}.00
              </Text>
            </Row>
          ))}
        </Stack>
      </Dialog>
    </View>
  );
}
