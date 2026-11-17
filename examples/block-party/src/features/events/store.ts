import { z } from 'zod';
import { createStore } from '@/src/foundations/persistence/store';
import { deviceBackend } from '@/src/foundations/persistence/device';

export const rsvpStore = createStore<Record<string, boolean>>({ key: 'rsvps', version: 1, defaults: {}, backend: deviceBackend, validate: z.record(z.string(), z.boolean()).parse });
