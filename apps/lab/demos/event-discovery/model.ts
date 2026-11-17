// Pure state model for the Event Discovery demo: filtering, selection, booking validation and confirmation.
import { bookingDays, categories, closedDays, events, seatsTaken, slots, type EventCategory, type KyotoEvent } from './fixtures';

export type Screen = 'discovery' | 'detail' | 'booking' | 'confirmed';
export interface Booking { ref: string; eventId: string; date: string; slotId: string; guests: number; totalCents: number }
export interface State {
  screen: Screen; query: string; categories: EventCategory[]; eventId: string | null;
  date: string; slotId: string | null; guests: number; confirming: boolean; submitting: boolean;
  bookings: Booking[]; lastBookingRef: string | null;
}
export type Action =
  | { type: 'search'; query: string } | { type: 'toggleCategory'; id: string } | { type: 'clearFilters' }
  | { type: 'open'; eventId: string } | { type: 'back' } | { type: 'startBooking' }
  | { type: 'selectDate'; date: string } | { type: 'selectSlot'; slotId: string } | { type: 'setGuests'; guests: number }
  | { type: 'requestConfirm' } | { type: 'cancelConfirm' } | { type: 'submit' } | { type: 'submitted' }
  | { type: 'cancelBooking'; ref: string } | { type: 'restart' };

export const initialState: State = { screen: 'discovery', query: '', categories: [], eventId: null, date: bookingDays[0].date, slotId: null, guests: 1, confirming: false, submitting: false, bookings: [], lastBookingRef: null };

export const eventById = (id: string | null): KyotoEvent | undefined => events.find((e) => e.id === id);
export const seatsLeft = (eventId: string, date: string, slotId: string) => {
  const e = eventById(eventId);
  return e ? Math.max(0, e.capacity - (seatsTaken[`${eventId}|${date}|${slotId}`] ?? 0)) : 0;
};
export const isDayOpen = (eventId: string, date: string) => !(closedDays[eventId] ?? []).includes(date) && slots.some((s) => seatsLeft(eventId, date, s.id) > 0);

export function visibleEvents(s: Pick<State, 'query' | 'categories'>) {
  const q = s.query.trim().toLowerCase();
  return events.filter((e) => (s.categories.length === 0 || s.categories.includes(e.category)) && (!q || `${e.title} ${e.area} ${e.host}`.toLowerCase().includes(q)));
}
/** Filter chips with live counts (counts respect the search text). */
export function filterOptions(s: Pick<State, 'query' | 'categories'>) {
  const base = visibleEvents({ query: s.query, categories: [] });
  return [{ id: 'all', label: 'All Experiences', count: base.length }, ...categories.map((c) => ({ id: c.id, label: c.label, count: base.filter((e) => e.category === c.id).length }))];
}
export const selectedFilterIds = (s: State) => (s.categories.length ? s.categories : ['all']);
export const bookingFor = (s: State, eventId: string) => s.bookings.find((b) => b.eventId === eventId);
export const canConfirm = (s: State) => Boolean(s.eventId && s.slotId && isDayOpen(s.eventId, s.date) && seatsLeft(s.eventId, s.date, s.slotId) >= s.guests);
export const totalCents = (s: State) => (eventById(s.eventId)?.priceCents ?? 0) * s.guests;
const firstOpenDay = (eventId: string) => bookingDays.find((d) => isDayOpen(eventId, d.date))?.date ?? bookingDays[0].date;

export function reducer(s: State, a: Action): State {
  switch (a.type) {
    case 'search': return { ...s, query: a.query };
    case 'toggleCategory': {
      if (a.id === 'all') return { ...s, categories: [] };
      const id = a.id as EventCategory;
      return { ...s, categories: s.categories.includes(id) ? s.categories.filter((c) => c !== id) : [...s.categories, id] };
    }
    case 'clearFilters': return { ...s, categories: [], query: '' };
    case 'open': return eventById(a.eventId) ? { ...s, screen: 'detail', eventId: a.eventId } : s;
    case 'back':
      if (s.screen === 'booking') return { ...s, screen: 'detail', confirming: false };
      if (s.screen === 'detail') return { ...s, screen: 'discovery' };
      return s;
    case 'startBooking': {
      if (!s.eventId) return s;
      return { ...s, screen: 'booking', date: firstOpenDay(s.eventId), slotId: null, guests: 1, confirming: false };
    }
    case 'selectDate': {
      if (!s.eventId || !isDayOpen(s.eventId, a.date)) return s;
      // Keep the chosen time only if it still has room on the new day.
      const keep = s.slotId && seatsLeft(s.eventId, a.date, s.slotId) >= s.guests ? s.slotId : null;
      return { ...s, date: a.date, slotId: keep };
    }
    case 'selectSlot': return s.eventId && seatsLeft(s.eventId, s.date, a.slotId) > 0 ? { ...s, slotId: a.slotId, guests: Math.min(s.guests, seatsLeft(s.eventId, s.date, a.slotId)) } : s;
    case 'setGuests': {
      const max = s.eventId && s.slotId ? seatsLeft(s.eventId, s.date, s.slotId) : 4;
      return { ...s, guests: Math.max(1, Math.min(a.guests, Math.min(4, max))) };
    }
    case 'requestConfirm': return canConfirm(s) ? { ...s, confirming: true } : s;
    case 'cancelConfirm': return s.submitting ? s : { ...s, confirming: false };
    case 'submit': return canConfirm(s) && !s.submitting ? { ...s, submitting: true } : s;
    case 'submitted': {
      if (!s.submitting || !s.eventId || !s.slotId) return s;
      const ref = `KYO-${s.eventId.toUpperCase()}-${s.date.slice(5).replace('-', '')}-${s.slotId.toUpperCase()}`;
      const booking: Booking = { ref, eventId: s.eventId, date: s.date, slotId: s.slotId, guests: s.guests, totalCents: totalCents(s) };
      return { ...s, submitting: false, confirming: false, screen: 'confirmed', lastBookingRef: ref, bookings: [...s.bookings.filter((b) => b.eventId !== s.eventId), booking] };
    }
    case 'cancelBooking': return { ...s, bookings: s.bookings.filter((b) => b.ref !== a.ref) };
    case 'restart': return { ...s, screen: 'discovery', eventId: null, slotId: null, confirming: false };
  }
}
export const slotLabel = (id: string | null) => slots.find((x) => x.id === id)?.time ?? '';
export const dayLabel = (date: string) => { const d = bookingDays.find((x) => x.date === date); return d ? `${d.dayName} ${d.monthName} ${d.dayNumber}` : date; };
