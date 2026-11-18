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
  /** Explicit glance-dashboard slots. Legacy pages without these keep their original field heuristics. */
  glance?: { value: Template; label?: Template; progressField?: string; unit?: Template };
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

export interface CustomSubject {
  kind: 'custom';
  source?: string;
  component: string;
  props?: Record<string, unknown>;
}

export type Subject = ListSubject | DetailSubject | FormSubject | SettingsSubject | MessageSubject | CustomSubject;

/** Factory-owned compositional archetypes that determine how the page subject is visually arranged. */
export type PageArchetype =
  | 'hero-decision'
  | 'glance-dashboard'
  | 'focus-wizard'
  | 'bento-overview'
  | 'content-canvas'
  | 'system-settings';

export type GlanceLayoutVariant = 'radial-hero' | 'metric-split' | 'summary-stack';
export type ContentCanvasLayoutVariant = 'editorial-feature' | 'immersive-bleed' | 'card-canvas';
export type BentoOverviewLayoutVariant = 'asymmetric-hero' | 'uniform-grid' | 'priority-feed';
export type HeroDecisionLayoutVariant = 'monumental-prompt' | 'split-choice' | 'action-sheet';
export type FocusWizardLayoutVariant = 'stage-stepper' | 'calm-single-input' | 'card-stack';
export type SystemSettingsLayoutVariant = 'grouped-cards' | 'inset-grouped' | 'minimal-divider';

export type ArchetypeLayoutVariant =
  | GlanceLayoutVariant
  | ContentCanvasLayoutVariant
  | BentoOverviewLayoutVariant
  | HeroDecisionLayoutVariant
  | FocusWizardLayoutVariant
  | SystemSettingsLayoutVariant;

export interface PageCompositionSpec {
  focalPoint?: 'hero' | 'telemetry' | 'action' | 'canvas' | 'balanced';
  layoutVariant?: ArchetypeLayoutVariant | string;
  mediaPlacement?: 'masthead' | 'inset-card' | 'ambient-background' | 'hidden';
  actionPlacement?: 'docked-bottom' | 'inline' | 'floating-bar' | 'header';
}

export interface PageSpec {
  route: string;
  title: Template;
  subtitle?: Template;
  archetype?: PageArchetype;
  composition?: PageCompositionSpec;
  back?: boolean;
  headerAction?: { label: string; event: EventRef };
  subject: Subject;
  primary?: { label: string; event: EventRef; tone?: 'default' | 'danger' };
  events?: Record<EventRef, Action[]>;
  empty?: { title: string; description?: string; action?: { label: string; event: EventRef } };
}

export interface ExperienceSpec {
  hierarchy?: 'media-led' | 'typography-led' | 'data-led' | 'task-led';
  motion?: 'subtle' | 'expressive' | 'none';
  pacing?: 'compact' | 'relaxed' | 'monumental';
}

export interface AppDesignSpec {
  colorMode?: 'system' | 'light' | 'dark';
  preset?: 'minimal-pro' | 'kyoto-craft' | 'fintech-midnight' | 'wellness-botanical' | 'editorial-luxury' | 'playful-consumer';
  palette?: 'default' | 'kyoto' | 'midnight' | 'emerald' | 'crimson' | 'amber';
  radius?: 'sharp' | 'smooth' | 'curved';
  density?: 'compact' | 'comfortable' | 'spacious';
  typography?: 'compact' | 'default' | 'editorial';
  surface?: 'flat' | 'outlined' | 'elevated';
  layout?: 'standard' | 'editorial' | 'immersive';
  media?: 'contained' | 'edge-to-edge' | 'mosaic';
  experience?: ExperienceSpec;
}

export interface AppSpec {
  name: string;
  design?: AppDesignSpec;
  mock?: { latencyMs?: number; failFirstLoad?: string[] };
  data: Record<string, Record<string, unknown>[]>;
  settings?: Record<string, boolean>;
  pages: Record<string, PageSpec>;
}
