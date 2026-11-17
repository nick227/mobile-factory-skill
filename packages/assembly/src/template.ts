// "{field}" interpolation against a record, with a few presentation formats.
const DAY = 86_400_000;
// Date-only strings ("2026-11-18") are calendar days, not instants: compare them with the user's local today.
export function relativeDay(iso: string, now = new Date()): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  const t = m ? Date.UTC(+m[1], +m[2] - 1, +m[3]) : Date.parse(iso);
  if (Number.isNaN(t)) return iso;
  const day = m ? t : Date.UTC(new Date(t).getFullYear(), new Date(t).getMonth(), new Date(t).getDate());
  const days = Math.round((day - Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())) / DAY);
  if (days === 0) return 'today';
  if (days === 1) return 'tomorrow';
  if (days === -1) return 'yesterday';
  return days > 0 ? `in ${days} days` : `${-days} days ago`;
}
const FORMATS: Record<string, (v: unknown) => string> = {
  date: (v) => { const t = Date.parse(String(v)); return Number.isNaN(t) ? String(v ?? '') : new Date(t).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }); },
  relative: (v) => relativeDay(String(v ?? '')),
  upper: (v) => String(v ?? '').toUpperCase(),
  yesno: (v) => (v ? 'Yes' : 'No'),
};
export const formats = Object.keys(FORMATS);
export function fill(template: string | undefined, rec: Record<string, unknown> | undefined): string {
  if (!template) return '';
  return template.replace(/\{([a-zA-Z0-9_.]+)(?:\|([a-z]+))?\}/g, (_, path: string, fmt?: string) => {
    const value = path.split('.').reduce<unknown>((o, k) => (o && typeof o === 'object' ? (o as Record<string, unknown>)[k] : undefined), rec);
    if (fmt && FORMATS[fmt]) return FORMATS[fmt](value);
    return value === undefined || value === null ? '' : String(value);
  });
}
/** "usedUp" → truthy field, "!usedUp" → falsy field. */
export function holds(when: string | undefined, rec: Record<string, unknown> | undefined): boolean {
  if (!when) return true;
  const neg = when.startsWith('!');
  const v = Boolean(rec?.[neg ? when.slice(1) : when]);
  return neg ? !v : v;
}
