// App specification: the only thing an agent writes for a presentation app.
// The factory turns it into routes; MonadPage renders every page from it. No JSX is authored per screen.
// Templates: "{field}" reads the current record; "{field|date}", "{field|relative}" format ISO dates.

export type Template = string;

/** Navigation, local-state and mock-data operations an interaction can trigger, run in order. */
export type Action =
  | { navigate: string; params?: Record<string, Template> }
  | { back: true }
  | { create: string; from?: 'form' }
  | { update: string; id?: Template; set?: Record<string, unknown>; from?: 'form' }
  | { remove: string; id?: Template }
  | { toggle: string; id?: Template; field: string }
  | { notice: Template; tone?: 'info' | 'success' | 'warning' | 'danger' }
  | { confirm: { title: Template; description: Template; confirmLabel?: string; destructive?: boolean }; then: Action[] };

export type EventRef = string;

export interface ListSubject {
  kind: 'collection';
  source: string;
  title: Template;
  description?: Template;
  badge?: { label: Template; tone?: 'neutral' | 'accent' | 'success' | 'warning' | 'danger'; when?: string };
  media?: { field: string; ratio: number };
  search?: { fields: string[]; placeholder?: string };
  segments?: { label: string; where?: Record<string, unknown> }[];
  sort?: { by: string; dir?: 'asc' | 'desc' };
  onSelect?: EventRef;
}

export interface DetailSubject {
  kind: 'detail';
  source: string;
  param?: string;
  media?: { field: string; ratio: number };
  heading?: Template;
  facts?: { label: string; value: Template }[];
  body?: Template;
  badge?: { label: Template; tone?: 'neutral' | 'accent' | 'success' | 'warning' | 'danger'; when?: string };
  actions?: { label: string; event: EventRef; tone?: 'default' | 'danger' }[];
}

export interface FieldSpec {
  key: string;
  label: string;
  type?: 'text' | 'multiline' | 'number' | 'date' | 'email' | 'toggle';
  required?: boolean;
  min?: number;
  max?: number;
  placeholder?: string;
  hint?: string;
  default?: string | number | boolean;
}

export interface FormSubject {
  kind: 'form';
  source: string;
  mode: 'create' | 'edit';
  param?: string;
  fields: FieldSpec[];
}

export interface SettingsSubject {
  kind: 'settings';
  groups: { title: string; toggles?: { key: string; label: string; description?: string }[]; links?: { title: string; description?: string; event: EventRef }[] }[];
}

export interface MessageSubject {
  kind: 'message';
  heading: Template;
  body?: Template;
}

export type Subject = ListSubject | DetailSubject | FormSubject | SettingsSubject | MessageSubject;

export interface PageSpec {
  route: string;
  title: Template;
  subtitle?: Template;
  back?: boolean;
  headerAction?: { label: string; event: EventRef };
  subject: Subject;
  primary?: { label: string; event: EventRef; tone?: 'default' | 'danger' };
  events?: Record<EventRef, Action[]>;
  empty?: { title: string; description?: string; action?: { label: string; event: EventRef } };
}

export interface AppSpec {
  name: string;
  design?: { colorMode?: 'system' | 'light' | 'dark' };
  mock?: { latencyMs?: number; failFirstLoad?: string[] };
  data: Record<string, Record<string, unknown>[]>;
  settings?: Record<string, boolean>;
  pages: Record<string, PageSpec>;
}
