// Validated public configuration. Expo only inlines EXPO_PUBLIC_* variables that
// are written out literally, so pass them explicitly:
//   export const env = readEnv(EnvSchema, { EXPO_PUBLIC_API_URL: process.env.EXPO_PUBLIC_API_URL });
// Never put secrets in EXPO_PUBLIC_* — they are embedded in the app bundle.
import { z } from 'zod';

export class EnvError extends Error {
  constructor(readonly problems: string[]) {
    super(`Invalid app configuration:\n- ${problems.join('\n- ')}\nSet them in .env (see .env.example) and restart the bundler.`);
    this.name = 'EnvError';
  }
}

export function readEnv<S extends z.ZodObject>(schema: S, values: Record<string, string | undefined>): z.infer<S> {
  const keys = Object.keys(schema.shape);
  const bad = keys.filter((k) => !k.startsWith('EXPO_PUBLIC_'));
  if (bad.length) throw new EnvError(bad.map((k) => `${k}: only EXPO_PUBLIC_* variables reach the app; keep secrets on a server`));
  const result = schema.safeParse(values);
  if (!result.success) throw new EnvError(result.error.issues.map((i) => `${String(i.path[0])}: ${i.message}`));
  return result.data;
}
