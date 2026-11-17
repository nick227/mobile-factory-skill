export type Category = 'ceramics' | 'woodwork' | 'tea' | 'textiles';
export interface Product { id: string; brand: string; title: string; category: Category; priceCents: number; originalPriceCents?: number; rating: number; reviewCount: number; stock: number; description: string }
export const categories: { id: Category; label: string }[] = [
  { id: 'ceramics', label: 'Kyoto Ceramics' }, { id: 'woodwork', label: 'Yoshino Cedar' }, { id: 'tea', label: 'Tea Utensils' }, { id: 'textiles', label: 'Nishijin Weaving' },
];
export const products: Product[] = [
  { id: 'prod-1', brand: 'Kihara Pottery', title: 'Arita Ware Celadon Matcha Bowl', category: 'ceramics', priceCents: 12000, originalPriceCents: 14500, rating: 4.9, reviewCount: 48, stock: 8, description: 'Hand-thrown and glazed in a pale celadon that deepens where the glaze pools.' },
  { id: 'prod-2', brand: 'Nakagawa Mokkougei', title: 'Curved Sawara Wood Cooler', category: 'woodwork', priceCents: 38000, rating: 5.0, reviewCount: 16, stock: 1, description: 'Bent sawara cypress bound with copper hoops; one of a small seasonal batch.' },
  { id: 'prod-3', brand: 'Kaikado', title: 'Hammered Tin Tea Caddy', category: 'tea', priceCents: 17500, originalPriceCents: 19500, rating: 4.8, reviewCount: 82, stock: 5, description: 'An airtight chazutsu whose lid slides closed under its own weight.' },
  { id: 'prod-4', brand: 'Hosoo Kyoto', title: 'Kinran Gold Leaf Silk Cushion', category: 'textiles', priceCents: 21000, rating: 4.7, reviewCount: 24, stock: 6, description: 'Nishijin brocade woven with gold-leaf thread on a 1688 loom pattern.' },
  { id: 'prod-5', brand: 'Kihara Pottery', title: 'Kiyomizu Ware Sake Cups (Pair)', category: 'ceramics', priceCents: 6800, rating: 4.6, reviewCount: 31, stock: 12, description: 'Two cups with a cobalt wave motif, sized for warm sake.' },
  { id: 'prod-6', brand: 'Kanaami Tsuji', title: 'Hand-Woven Copper Tea Strainer', category: 'tea', priceCents: 9500, rating: 4.9, reviewCount: 57, stock: 0, description: 'Copper mesh woven by hand in Kyoto; back in stock next month.' },
];
export const SHIPPING = { standard: { label: 'Standard (5–7 days)', cents: 1500, freeOverCents: 30000 }, express: { label: 'Express (2 days)', cents: 3500, freeOverCents: Infinity } } as const;
export const TAX_RATE = 0.1;
