// Pure marketplace model: filtering, stock-aware cart quantities, totals, checkout validation and order confirmation.
import { categories, products, SHIPPING, TAX_RATE, type Category, type Product } from './fixtures';

export type Screen = 'browse' | 'product' | 'cart' | 'checkout' | 'confirmed';
export type Shipping = keyof typeof SHIPPING;
export interface Order { number: string; lines: { title: string; qty: number; cents: number }[]; totalCents: number; shipTo: string }
export interface State {
  screen: Screen; categories: Category[]; productId: string | null; qtyDraft: number; cart: Record<string, number>;
  name: string; address: string; shipping: Shipping; attempted: boolean; confirming: boolean; submitting: boolean; order: Order | null; orders: number;
  notice: string | null;
}
export type Action =
  | { type: 'toggleCategory'; id: string } | { type: 'clearFilters' } | { type: 'view'; productId: string } | { type: 'setDraft'; qty: number }
  | { type: 'add'; productId: string; qty?: number } | { type: 'setQty'; productId: string; qty: number } | { type: 'remove'; productId: string } | { type: 'empty' }
  | { type: 'go'; screen: 'browse' | 'cart' | 'checkout' } | { type: 'field'; field: 'name' | 'address'; value: string } | { type: 'shipping'; shipping: Shipping }
  | { type: 'requestConfirm' } | { type: 'cancelConfirm' } | { type: 'submit' } | { type: 'submitted' } | { type: 'continueShopping' };

export const initialState: State = { screen: 'browse', categories: [], productId: null, qtyDraft: 1, cart: {}, name: '', address: '', shipping: 'standard', attempted: false, confirming: false, submitting: false, order: null, orders: 0, notice: null };

export const productById = (id: string | null): Product | undefined => products.find((p) => p.id === id);
export const visibleProducts = (s: State) => products.filter((p) => s.categories.length === 0 || s.categories.includes(p.category));
export const filterOptions = () => [{ id: 'all', label: 'All Artifacts', count: products.length }, ...categories.map((c) => ({ id: c.id, label: c.label, count: products.filter((p) => p.category === c.id).length }))];
export const selectedFilterIds = (s: State) => (s.categories.length ? s.categories : ['all']);
export const inCart = (s: State, id: string) => s.cart[id] ?? 0;
export const remaining = (s: State, id: string) => Math.max(0, (productById(id)?.stock ?? 0) - inCart(s, id));
export const stockStatus = (s: State, p: Product) => (remaining(s, p.id) === 0 ? 'out_of_stock' : remaining(s, p.id) <= 2 ? 'low_stock' : 'in_stock') as 'in_stock' | 'low_stock' | 'out_of_stock';
export const stockLabel = (s: State, p: Product) => (p.stock === 0 ? 'Sold out' : remaining(s, p.id) === 0 ? 'All in your bag' : remaining(s, p.id) <= 2 ? `Only ${remaining(s, p.id)} left` : undefined);
export const lines = (s: State) => Object.entries(s.cart).filter(([, q]) => q > 0).map(([id, qty]) => { const p = productById(id)!; return { product: p, qty, cents: p.priceCents * qty }; });
export const itemCount = (s: State) => lines(s).reduce((n, l) => n + l.qty, 0);
export const subtotal = (s: State) => lines(s).reduce((n, l) => n + l.cents, 0);
export const savings = (s: State) => lines(s).reduce((n, l) => n + ((l.product.originalPriceCents ?? l.product.priceCents) - l.product.priceCents) * l.qty, 0);
export const shippingCents = (s: State) => { const o = SHIPPING[s.shipping]; return subtotal(s) === 0 || subtotal(s) >= o.freeOverCents ? 0 : o.cents; };
export const taxCents = (s: State) => Math.round(subtotal(s) * TAX_RATE);
export const total = (s: State) => subtotal(s) + shippingCents(s) + taxCents(s);
export function checkoutErrors(s: State) {
  const e: Partial<Record<'name' | 'address' | 'cart', string>> = {};
  if (s.name.trim().length < 2) e.name = 'Enter the recipient name';
  if (s.address.trim().length < 8) e.address = 'Enter a full delivery address';
  if (itemCount(s) === 0) e.cart = 'Your bag is empty';
  return e;
}

function setQty(s: State, id: string, qty: number): State {
  const p = productById(id);
  if (!p) return s;
  const clamped = Math.max(0, Math.min(qty, p.stock));
  const cart = { ...s.cart };
  if (clamped === 0) delete cart[id]; else cart[id] = clamped;
  return { ...s, cart, notice: qty > p.stock ? `Only ${p.stock} available` : null };
}

export function reducer(s: State, a: Action): State {
  if (s.submitting && a.type !== 'submitted') return s;
  switch (a.type) {
    case 'toggleCategory': {
      if (a.id === 'all') return { ...s, categories: [] };
      const id = a.id as Category;
      return { ...s, categories: s.categories.includes(id) ? s.categories.filter((c) => c !== id) : [...s.categories, id] };
    }
    case 'clearFilters': return { ...s, categories: [] };
    case 'view': return productById(a.productId) ? { ...s, screen: 'product', productId: a.productId, qtyDraft: Math.min(1, remaining(s, a.productId)) || 0 } : s;
    case 'setDraft': return s.productId ? { ...s, qtyDraft: Math.max(1, Math.min(a.qty, remaining(s, s.productId))) } : s;
    case 'add': {
      const qty = a.qty ?? 1;
      if (qty <= 0 || remaining(s, a.productId) === 0) return { ...s, notice: 'No more stock available' };
      const next = setQty(s, a.productId, inCart(s, a.productId) + qty);
      return { ...next, notice: `Added ${Math.min(qty, remaining(s, a.productId))} × ${productById(a.productId)!.title}`, qtyDraft: 1 };
    }
    case 'setQty': return setQty(s, a.productId, a.qty);
    case 'remove': return setQty(s, a.productId, 0);
    case 'empty': return { ...s, cart: {}, notice: null };
    case 'go': return a.screen === 'checkout' && itemCount(s) === 0 ? s : { ...s, screen: a.screen, notice: null };
    case 'field': return { ...s, [a.field]: a.value };
    case 'shipping': return { ...s, shipping: a.shipping };
    case 'requestConfirm': return Object.keys(checkoutErrors(s)).length ? { ...s, attempted: true } : { ...s, attempted: true, confirming: true };
    case 'cancelConfirm': return { ...s, confirming: false };
    case 'submit': return s.confirming && !Object.keys(checkoutErrors(s)).length ? { ...s, submitting: true } : s;
    case 'submitted': {
      if (!s.submitting) return s;
      const number = `KM-${String(1042 + s.orders).padStart(5, '0')}`;
      const order: Order = { number, lines: lines(s).map((l) => ({ title: l.product.title, qty: l.qty, cents: l.cents })), totalCents: total(s), shipTo: `${s.name.trim()}, ${s.address.trim()}` };
      return { ...s, submitting: false, confirming: false, screen: 'confirmed', order, orders: s.orders + 1, cart: {}, attempted: false };
    }
    case 'continueShopping': return { ...s, screen: 'browse', productId: null, notice: null };
  }
}
