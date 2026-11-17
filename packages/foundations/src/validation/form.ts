// Turn a zod schema into per-field form errors. Plugs directly into
// recipe.form-screen's `validate` prop and TextField's `error` prop.
import { z } from 'zod';

export type FieldErrors<T> = Partial<Record<Extract<keyof T, string>, string>>;

export function fieldErrors<S extends z.ZodType>(schema: S, values: unknown): FieldErrors<z.input<S>> {
  const result = schema.safeParse(values);
  if (result.success) return {};
  const errors: Record<string, string> = {};
  for (const issue of result.error.issues) {
    const field = String(issue.path[0] ?? '_form');
    errors[field] ??= issue.message; // first message per field
  }
  return errors as FieldErrors<z.input<S>>;
}

/** `validate` function for forms: returns {} when valid. */
export const validatorFor = <S extends z.ZodType>(schema: S) => (values: unknown) => fieldErrors(schema, values);
