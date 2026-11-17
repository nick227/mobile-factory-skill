export const disciplines = [
  { id: 'architecture', title: 'Architectural Design', description: 'Pavilion, spatial and interior scale. Access 3D model archives and CAD blueprints.', badge: 'Popular', badgeTone: 'accent' as const },
  { id: 'ceramics', title: 'Ceramic Arts', description: 'Wheel-thrown stoneware and glazing. Kiln scheduling and glaze formula database.' },
  { id: 'printmaking', title: 'Woodblock & Intaglio', description: 'Relief and lithographic printing. Studio press bookings and archival paper.' },
];
export const plans = [
  { id: 'guest', name: 'Guest Access', priceCents: 1900, inclusions: ['10 studio hours per month', 'Lounge library access'] },
  { id: 'studio', name: 'Studio Member', priceCents: 4900, inclusions: ['24/7 keycard studio access', 'Shared darkroom and kiln access', 'Gigabit fiber and lounge library'] },
  { id: 'fellow', name: 'Fellowship Resident', priceCents: 12000, inclusions: ['Everything in Studio Member', 'Private bench and locker', 'Monthly critique with a master'] },
];
export type PlanId = (typeof plans)[number]['id'];
