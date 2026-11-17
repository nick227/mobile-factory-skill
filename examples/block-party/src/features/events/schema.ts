import { z } from 'zod';
import { isoDate, isoDateNotPast, optionalText, requiredText } from '@/src/foundations/validation/schemas';

export const Event = z.object({ id: z.string(), title: z.string(), date: isoDate(), venue: z.string(), description: z.string().optional(), coverUrl: z.string().optional(), rsvpCount: z.number().int() });
export type Event = z.infer<typeof Event>;
export const EventList = z.array(Event);
export const NewEventForm = z.object({ title: requiredText('Title', 3, 80), date: isoDateNotPast('Date'), venue: requiredText('Venue'), description: optionalText('Description', 500) });
export type NewEventInput = z.output<typeof NewEventForm>;
