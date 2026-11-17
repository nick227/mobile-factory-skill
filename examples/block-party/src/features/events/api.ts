import { createApiClient } from '@/src/foundations/api-client/client';
import { mock } from './mock';
import { Event, EventList, type NewEventInput } from './schema';

const api = createApiClient({ transport: mock.transport });
export const listEvents = (q: string, signal: AbortSignal) => api.get('/events', { query: { q }, signal, parse: EventList.parse });
export const getEvent = (id: string, signal: AbortSignal) => api.get(`/events/${id}`, { signal, parse: Event.parse });
export const createEvent = (input: NewEventInput) => api.post('/events', input, { parse: Event.parse });
export const setRsvp = (id: string, attending: boolean) => api.post(`/events/${id}/rsvp`, { attending }, { parse: Event.parse });
