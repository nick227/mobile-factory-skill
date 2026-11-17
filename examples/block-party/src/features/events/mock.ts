import { createMockTransport, mockError } from '@/src/foundations/api-client/mock';
import type { Event, NewEventInput } from './schema';

const events: Event[] = [
  { id: 'e1', title: 'Street Picnic', date: '2026-12-05', venue: 'Elm Street', rsvpCount: 12, coverUrl: 'https://picsum.photos/seed/e1/800/450' },
  { id: 'e2', title: 'Garden Swap', date: '2026-12-12', venue: 'Community Garden', rsvpCount: 4 },
];
export const mock = createMockTransport({
  'GET /events': (req) => { const q = String(req.query?.q ?? '').toLowerCase(); return events.filter((e) => !q || `${e.title} ${e.venue}`.toLowerCase().includes(q)); },
  'GET /events/:id': (_r, { id }) => events.find((e) => e.id === id) ?? (() => { throw mockError(404, 'Event not found'); })(),
  'POST /events': (req) => { const input = req.body as NewEventInput; const e: Event = { id: `e${events.length + 1}`, rsvpCount: 0, ...input }; events.unshift(e); return e; },
  'POST /events/:id/rsvp': (req, { id }) => { const e = events.find((x) => x.id === id); if (!e) throw mockError(404, 'Event not found'); e.rsvpCount += (req.body as { attending: boolean }).attending ? 1 : -1; return e; },
});
