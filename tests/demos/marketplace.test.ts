import test from 'node:test';
import assert from 'node:assert/strict';
import { initialState, reducer, visibleProducts, itemCount, subtotal, savings, shippingCents, taxCents, total, checkoutErrors, remaining, stockStatus, productById, type Action, type State } from '../../apps/lab/demos/marketplace/model';

const run = (actions: Action[], s: State = initialState) => actions.reduce(reducer, s);

test('filtering by category and "all"', () => {
  assert.deepEqual(visibleProducts(run([{ type: 'toggleCategory', id: 'tea' }])).map((p) => p.id), ['prod-3', 'prod-6']);
  assert.equal(visibleProducts(run([{ type: 'toggleCategory', id: 'tea' }, { type: 'toggleCategory', id: 'all' }])).length, 6);
});

test('cart quantities respect stock; add, change and remove keep totals exact', () => {
  let s = run([{ type: 'add', productId: 'prod-1' }, { type: 'add', productId: 'prod-1' }, { type: 'add', productId: 'prod-5', qty: 3 }]);
  assert.equal(itemCount(s), 5);
  assert.equal(subtotal(s), 2 * 12000 + 3 * 6800);
  assert.equal(savings(s), 2 * 2500);
  s = run([{ type: 'add', productId: 'prod-2' }, { type: 'add', productId: 'prod-2' }], s);
  assert.equal(s.cart['prod-2'], 1, 'only 1 cooler in stock');
  assert.equal(stockStatus(s, productById('prod-2')!), 'out_of_stock');
  assert.match(s.notice!, /No more stock/);
  assert.equal(reducer(s, { type: 'add', productId: 'prod-6' }).cart['prod-6'], undefined, 'sold-out item cannot be added');
  const over = reducer(s, { type: 'setQty', productId: 'prod-1', qty: 99 });
  assert.equal(over.cart['prod-1'], 8, 'cart quantity clamped to stock');
  assert.equal(over.notice, 'Only 8 available');
  s = run([{ type: 'setQty', productId: 'prod-5', qty: 1 }, { type: 'remove', productId: 'prod-2' }], s);
  assert.equal(itemCount(s), 3);
  assert.equal(remaining(s, 'prod-2'), 1);
  assert.equal(subtotal(s), 2 * 12000 + 6800);
  assert.equal(shippingCents(s), 0, 'free standard shipping over $300');
  assert.equal(shippingCents(reducer(s, { type: 'shipping', shipping: 'express' })), 3500, 'express is never free');
  assert.equal(shippingCents(run([{ type: 'add', productId: 'prod-5' }])), 1500, 'standard under $300 is charged');
  assert.equal(total(s), subtotal(s) + taxCents(s));
});

test('full journey: product → cart → checkout validation → confirmation clears the cart', () => {
  let s = run([{ type: 'view', productId: 'prod-3' }, { type: 'setDraft', qty: 9 }]);
  assert.equal(s.qtyDraft, 5, 'draft limited to stock');
  s = run([{ type: 'setDraft', qty: 2 }, { type: 'add', productId: 'prod-3', qty: 2 }, { type: 'go', screen: 'cart' }, { type: 'go', screen: 'checkout' }], s);
  assert.equal(s.screen, 'checkout');
  s = reducer(s, { type: 'requestConfirm' });
  assert.equal(s.confirming, false);
  assert.deepEqual(Object.keys(checkoutErrors(s)).sort(), ['address', 'name']);
  s = run([{ type: 'field', field: 'name', value: 'Aiko Mori' }, { type: 'field', field: 'address', value: '12 Shijo-dori, Kyoto' }, { type: 'requestConfirm' }, { type: 'submit' }], s);
  const expected = total(s);
  s = reducer(s, { type: 'submitted' });
  assert.equal(s.screen, 'confirmed');
  assert.equal(s.order!.totalCents, expected);
  assert.deepEqual(s.order!.lines, [{ title: 'Hammered Tin Tea Caddy', qty: 2, cents: 35000 }]);
  assert.equal(itemCount(s), 0);
  assert.equal(s.order!.number, 'KM-01042');
  assert.equal(reducer(initialState, { type: 'go', screen: 'checkout' }).screen, 'browse', 'empty bag cannot check out');
});
