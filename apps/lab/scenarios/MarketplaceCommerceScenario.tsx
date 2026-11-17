import React, { useEffect, useReducer } from 'react';
import { View } from 'react-native';
import {
  Text,
  Stack,
  Row,
  Surface,
  Button,
  Divider,
  ScreenHeader,
  DiscoveryFilters,
  ProductShowcase,
  SelectionDock,
  SegmentedControl,
  TextField,
  EmptyState,
  Dialog,
  tokens,
} from '@factory/ui';
import { SHIPPING } from '../demos/marketplace/fixtures';
import {
  initialState, reducer, visibleProducts, filterOptions, selectedFilterIds, productById, stockStatus, stockLabel, remaining, inCart,
  lines, itemCount, subtotal, savings, shippingCents, taxCents, total, checkoutErrors, type Shipping,
} from '../demos/marketplace/model';
import { formatUSD } from '../demos/shared/money';

function Stepper({ label, value, min, max, onChange }: { label: string; value: number; min: number; max: number; onChange: (n: number) => void }) {
  return (
    <Row style={{ alignItems: 'center', gap: tokens.spacing.sm }}>
      <Button label="−" variant="outline" disabled={value <= min} onPress={() => onChange(value - 1)} accessibilityLabel={`Decrease ${label}`} />
      <Text style={{ minWidth: 28, textAlign: 'center', fontWeight: '700' }} accessibilityLabel={`${label} quantity ${value}`}>{value}</Text>
      <Button label="+" variant="outline" disabled={value >= max} onPress={() => onChange(value + 1)} accessibilityLabel={`Increase ${label}`} />
    </Row>
  );
}

export function MarketplaceCommerceScenario() {
  const [s, dispatch] = useReducer(reducer, initialState);
  const errors = s.attempted ? checkoutErrors(s) : {};

  useEffect(() => {
    if (!s.submitting) return;
    const t = setTimeout(() => dispatch({ type: 'submitted' }), 900);
    return () => clearTimeout(t);
  }, [s.submitting]);

  const totals = (
    <Stack gap="xs">
      <Row style={{ justifyContent: 'space-between' }}><Text muted>Subtotal ({itemCount(s)} items)</Text><Text>{formatUSD(subtotal(s))}</Text></Row>
      {savings(s) > 0 ? <Row style={{ justifyContent: 'space-between' }}><Text muted>You save</Text><Text>−{formatUSD(savings(s))}</Text></Row> : null}
      <Row style={{ justifyContent: 'space-between' }}><Text muted>Shipping</Text><Text>{shippingCents(s) === 0 ? 'Free' : formatUSD(shippingCents(s))}</Text></Row>
      <Row style={{ justifyContent: 'space-between' }}><Text muted>Tax (10%)</Text><Text>{formatUSD(taxCents(s))}</Text></Row>
      <Divider />
      <Row style={{ justifyContent: 'space-between' }}><Text style={{ fontWeight: '700' }}>Total</Text><Text style={{ fontWeight: '700' }}>{formatUSD(total(s))}</Text></Row>
    </Stack>
  );
  const notice = s.notice ? <Text variant="small" accessibilityRole="alert">{s.notice}</Text> : null;

  if (s.screen === 'confirmed' && s.order) {
    return (
      <Stack gap="lg">
        <ScreenHeader title="Order Confirmed" />
        <Surface outlined>
          <Stack gap="md">
            <Text variant="title">Thank you for supporting Kyoto craft</Text>
            <Text muted>Order {s.order.number} · shipping to {s.order.shipTo}</Text>
            {s.order.lines.map((l) => (
              <Row key={l.title} style={{ justifyContent: 'space-between' }}><Text variant="small" style={{ flex: 1 }}>{l.qty} × {l.title}</Text><Text variant="small">{formatUSD(l.cents)}</Text></Row>
            ))}
            <Divider />
            <Row style={{ justifyContent: 'space-between' }}><Text style={{ fontWeight: '700' }}>Paid</Text><Text style={{ fontWeight: '700' }}>{formatUSD(s.order.totalCents)}</Text></Row>
          </Stack>
        </Surface>
        <Button label="Continue Shopping" fullWidth onPress={() => dispatch({ type: 'continueShopping' })} />
      </Stack>
    );
  }

  if (s.screen === 'product' && s.productId) {
    const p = productById(s.productId)!;
    const left = remaining(s, p.id);
    return (
      <Stack gap="md">
        <ScreenHeader title={p.brand} backLabel="Marketplace" onBack={() => dispatch({ type: 'go', screen: 'browse' })} />
        <ProductShowcase id={p.id} brand={p.brand} title={p.title} price={formatUSD(p.priceCents)} originalPrice={p.originalPriceCents ? formatUSD(p.originalPriceCents) : undefined} rating={p.rating} reviewCount={p.reviewCount} stockStatus={stockStatus(s, p)} stockLabel={stockLabel(s, p)} />
        <Text>{p.description}</Text>
        {inCart(s, p.id) > 0 ? <Text muted variant="small">{inCart(s, p.id)} already in your bag</Text> : null}
        {left > 0 ? (
          <Stack gap="sm">
            <Stepper label={p.title} value={s.qtyDraft} min={1} max={left} onChange={(qty) => dispatch({ type: 'setDraft', qty })} />
            <Button label={`Add ${s.qtyDraft} to Bag · ${formatUSD(p.priceCents * s.qtyDraft)}`} fullWidth onPress={() => dispatch({ type: 'add', productId: p.id, qty: s.qtyDraft })} />
          </Stack>
        ) : (
          <Text muted>{p.stock === 0 ? 'Sold out. Back in stock next month.' : 'You have all available stock in your bag.'}</Text>
        )}
        {notice}
        {itemCount(s) > 0 ? <Button label={`View Bag (${itemCount(s)})`} variant="outline" fullWidth onPress={() => dispatch({ type: 'go', screen: 'cart' })} /> : null}
      </Stack>
    );
  }

  if (s.screen === 'cart') {
    return (
      <Stack gap="md">
        <ScreenHeader title="Your Bag" backLabel="Marketplace" onBack={() => dispatch({ type: 'go', screen: 'browse' })} />
        {lines(s).length === 0 ? (
          <EmptyState title="Your bag is empty" description="Add handcrafted pieces from the marketplace." action={<Button label="Browse Marketplace" onPress={() => dispatch({ type: 'go', screen: 'browse' })} />} />
        ) : (
          <Stack gap="md">
            {lines(s).map((l) => (
              <Surface key={l.product.id} outlined>
                <Stack gap="sm">
                  <Text style={{ fontWeight: '700' }}>{l.product.title}</Text>
                  <Text muted variant="small">{formatUSD(l.product.priceCents)} each · {formatUSD(l.cents)}</Text>
                  <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                    <Stepper label={l.product.title} value={l.qty} min={1} max={l.product.stock} onChange={(qty) => dispatch({ type: 'setQty', productId: l.product.id, qty })} />
                    <Button label="Remove" variant="ghost" onPress={() => dispatch({ type: 'remove', productId: l.product.id })} accessibilityLabel={`Remove ${l.product.title}`} />
                  </Row>
                </Stack>
              </Surface>
            ))}
            {notice}
            <Surface outlined>{totals}</Surface>
            <Button label="Checkout" fullWidth onPress={() => dispatch({ type: 'go', screen: 'checkout' })} />
          </Stack>
        )}
      </Stack>
    );
  }

  if (s.screen === 'checkout') {
    return (
      <Stack gap="md">
        <ScreenHeader title="Checkout" backLabel="Bag" onBack={() => dispatch({ type: 'go', screen: 'cart' })} />
        <TextField label="Recipient name" value={s.name} onChangeText={(value) => dispatch({ type: 'field', field: 'name', value })} error={errors.name} autoComplete="name" />
        <TextField label="Delivery address" value={s.address} onChangeText={(value) => dispatch({ type: 'field', field: 'address', value })} error={errors.address} multiline autoComplete="street-address" />
        <SegmentedControl label="Shipping" value={s.shipping} onValueChange={(v) => dispatch({ type: 'shipping', shipping: v as Shipping })} options={(Object.keys(SHIPPING) as Shipping[]).map((k) => ({ label: SHIPPING[k].label, value: k }))} />
        <Surface outlined>{totals}</Surface>
        <Button label={`Place Order · ${formatUSD(total(s))}`} fullWidth onPress={() => dispatch({ type: 'requestConfirm' })} />
        <Dialog
          open={s.confirming}
          onOpenChange={(open) => { if (!open) dispatch({ type: 'cancelConfirm' }); }}
          title="Confirm Purchase"
          description={`Pay ${formatUSD(total(s))} for ${itemCount(s)} items, shipped ${SHIPPING[s.shipping].label.toLowerCase()}?`}
          dismissible={!s.submitting}
          primaryAction={{ label: s.submitting ? 'Processing…' : `Pay ${formatUSD(total(s))}`, loading: s.submitting, disabled: s.submitting, onPress: () => dispatch({ type: 'submit' }) }}
          secondaryAction={{ label: 'Back to Checkout', onPress: () => dispatch({ type: 'cancelConfirm' }) }}
        />
      </Stack>
    );
  }

  // Browse
  const products = visibleProducts(s);
  return (
    <View style={{ flex: 1, paddingBottom: itemCount(s) > 0 ? 80 : 0 }}>
      <Stack gap="md">
        <ScreenHeader title="Artisan Marketplace" subtitle="Direct acquisitions from verified Kyoto master studios" />
        <DiscoveryFilters options={filterOptions()} selectedIds={selectedFilterIds(s)} onToggle={(id) => dispatch({ type: 'toggleCategory', id })} onClear={s.categories.length ? () => dispatch({ type: 'clearFilters' }) : undefined} />
        {notice}
        <Stack gap="md">
          {products.map((p) => (
            <ProductShowcase
              key={p.id}
              id={p.id}
              brand={p.brand}
              title={p.title}
              price={formatUSD(p.priceCents)}
              originalPrice={p.originalPriceCents ? formatUSD(p.originalPriceCents) : undefined}
              rating={p.rating}
              reviewCount={p.reviewCount}
              stockStatus={stockStatus(s, p)}
              stockLabel={stockLabel(s, p)}
              onPress={() => dispatch({ type: 'view', productId: p.id })}
              onAddToCart={() => dispatch({ type: 'add', productId: p.id })}
              addToCartLabel={inCart(s, p.id) ? `Add another (${inCart(s, p.id)} in bag)` : 'Add to Bag'}
            />
          ))}
        </Stack>
      </Stack>
      <SelectionDock
        visible={itemCount(s) > 0}
        selectedCount={itemCount(s)}
        title={`${itemCount(s)} in bag · ${formatUSD(subtotal(s))}`}
        primaryAction={{ label: 'View Bag', onPress: () => dispatch({ type: 'go', screen: 'cart' }) }}
        onClear={() => dispatch({ type: 'empty' })}
        clearLabel="Empty Bag"
      />
    </View>
  );
}
