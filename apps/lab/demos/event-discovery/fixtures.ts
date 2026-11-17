// Deterministic Kyoto experience catalog for the Event Discovery demo.
export type EventCategory = 'temples' | 'crafts' | 'culinary' | 'nature';
export interface KyotoEvent {
  id: string; title: string; area: string; category: EventCategory; host: string; durationLabel: string;
  priceCents: number; capacity: number; description: string; highlight: string; aspectRatio: number;
  badge?: string; attendeeIds: string[];
}
export interface Slot { id: string; time: string; period: 'morning' | 'afternoon' | 'evening' }

export const categories: { id: EventCategory; label: string }[] = [
  { id: 'temples', label: 'Heritage Temples' },
  { id: 'crafts', label: 'Artisan Crafts' },
  { id: 'culinary', label: 'Kaiseki Dining' },
  { id: 'nature', label: 'Gardens & Nature' },
];

export const people: Record<string, string> = {
  a1: 'Yuki Tanaka', a2: 'Clara Oswald', a3: 'Liam Davies', a4: 'Sora Park', a5: 'Marc Dupont', a6: 'Aiko Mori', a7: 'Noah Chen',
};

export const events: KyotoEvent[] = [
  { id: 'e1', title: 'Urasenke Tea Ceremony & Zen Garden', area: 'Central Kyoto', category: 'temples', host: 'Master Soshitsu Sen', durationLabel: '2 hrs', priceCents: 7500, capacity: 6, description: 'A private temae in a 16th-century sukiya pavilion, followed by a guided walk through the moss garden.', highlight: 'Includes a hand-glazed matcha bowl to keep', aspectRatio: 3 / 4, badge: 'Heritage', attendeeIds: ['a1', 'a2', 'a3', 'a4', 'a5'] },
  { id: 'e2', title: 'Bamboo Forest Dawn Walk', area: 'Arashiyama', category: 'nature', host: 'Ranger Kaito Ito', durationLabel: '90 min', priceCents: 4500, capacity: 12, description: 'Walk the Sagano grove before the crowds, ending with breakfast at a riverside tea house.', highlight: 'Early access before public opening', aspectRatio: 1, badge: 'Popular', attendeeIds: ['a6', 'a7'] },
  { id: 'e3', title: 'Woodblock Printing Workshop', area: 'Higashiyama', category: 'crafts', host: 'Studio Takezasado', durationLabel: '3 hrs', priceCents: 9500, capacity: 8, description: 'Carve and press a two-colour ukiyo-e print with a fifth-generation printmaker.', highlight: 'Take home your hand-pressed print', aspectRatio: 4 / 3, attendeeIds: ['a2', 'a4'] },
  { id: 'e4', title: 'Fushimi Sake Brewery & Tasting', area: 'Fushimi Ward', category: 'culinary', host: 'Gekkeikan Cellars', durationLabel: '2 hrs', priceCents: 6000, capacity: 10, description: 'Tour a historic cellar and taste five seasonal junmai sakes with paired small plates.', highlight: 'Historic cellar tour', aspectRatio: 3 / 4, attendeeIds: ['a3', 'a5', 'a7'] },
  { id: 'e5', title: 'Kinkaku-ji Golden Hour Visit', area: 'Northern Kyoto', category: 'temples', host: 'Heritage guide Emi Sato', durationLabel: '2 hrs', priceCents: 5500, capacity: 10, description: 'An after-hours visit to the Golden Pavilion with a guide versed in Muromachi history.', highlight: 'After-hours access', aspectRatio: 1, attendeeIds: ['a1'] },
  { id: 'e6', title: 'Kaiseki Cooking Masterclass', area: 'Gion', category: 'culinary', host: 'Chef Haruto Ono', durationLabel: '4 hrs', priceCents: 18000, capacity: 4, description: 'Prepare a seven-course seasonal kaiseki menu, then dine in a private tatami room.', highlight: 'Only 4 seats per session', aspectRatio: 4 / 3, badge: 'Limited', attendeeIds: ['a2', 'a6', 'a7'] },
];

/** Stories are hosts; tapping one opens that host's experience. */
export const stories = [
  { id: 's1', name: 'Kyoto Tea', eventId: 'e1', isLive: true },
  { id: 's2', name: 'Bamboo Path', eventId: 'e2', hasUnread: true },
  { id: 's3', name: 'Print Studio', eventId: 'e3', hasUnread: true },
  { id: 's4', name: 'Sake Cellar', eventId: 'e4' },
  { id: 's5', name: 'Kaiseki', eventId: 'e6' },
];

export const bookingDays = [
  { date: '2026-11-20', dayName: 'Fri', dayNumber: 20, monthName: 'Nov' },
  { date: '2026-11-21', dayName: 'Sat', dayNumber: 21, monthName: 'Nov' },
  { date: '2026-11-22', dayName: 'Sun', dayNumber: 22, monthName: 'Nov' },
  { date: '2026-11-23', dayName: 'Mon', dayNumber: 23, monthName: 'Nov' },
  { date: '2026-11-24', dayName: 'Tue', dayNumber: 24, monthName: 'Nov' },
];
export const slots: Slot[] = [
  { id: 'am', time: '10:00 AM', period: 'morning' },
  { id: 'pm', time: '01:30 PM', period: 'afternoon' },
  { id: 'eve', time: '05:00 PM', period: 'evening' },
];
/** Seats already taken, deterministic per event/date/slot. Missing = 0. */
export const seatsTaken: Record<string, number> = {
  'e1|2026-11-20|am': 6, 'e1|2026-11-21|pm': 4, 'e1|2026-11-23|eve': 6,
  'e2|2026-11-21|am': 12, 'e6|2026-11-20|eve': 4, 'e6|2026-11-21|eve': 4, 'e6|2026-11-24|eve': 3,
};
/** Closed days per event (e.g. temple ceremonies). */
export const closedDays: Record<string, string[]> = { e1: ['2026-11-22'], e5: ['2026-11-23'], e6: ['2026-11-22', '2026-11-23'] };
