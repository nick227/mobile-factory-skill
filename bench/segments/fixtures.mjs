// Deterministic project states at the entry of each workflow segment (02–08).
// Shared by tests/orchestrator.test.mjs (contract tests) and bench/segments/run.mjs (agent UAT).
// Everything is built through the real factory API, never by hand-writing project.json.
import fs from 'node:fs';
import path from 'node:path';
import * as engine from '../../factory-v1/engine.mjs';
import * as plan from '../../factory-v1/planner.mjs';

export const SPEC = `# Pantry Pal

## Product
Pantry Pal helps a household track what food they have at home so nothing expires unused.

Primary users are busy home cooks who shop once a week.

## Scope
- Add items with a name, quantity and expiry date.
- See items that expire soonest first.
- Mark an item as used up.

Not in v1: shopping lists, barcode scanning, sharing between households.

## Platform
Works offline; data stays on the phone. No accounts.
`;

const chat = (quote) => ({ id: 'chat', quote });
export const SCREENS = [
  { id: 'pantry', title: 'Pantry', purpose: 'See items, soonest expiry first', route: '/', components: ['primitives.screen', 'composites.listitem', 'composites.emptystate', 'controls.calmskeleton', 'controls.button'], recipe: 'recipe.collection-screen', states: ['loading', 'error', 'empty', 'ready'], actions: ['open-item', 'add-item'], acceptance: ['Items sorted by expiry ascending', 'Empty state offers Add item', 'Error state offers Retry'], basis: ['product.outcome', 'data.persistence'], entities: ['item'] },
  { id: 'item-new', title: 'Add item', purpose: 'Add one item in a few seconds', route: '/items/new', components: ['primitives.screen', 'controls.textfield', 'patterns.actionfooter'], recipe: 'recipe.form-screen', states: ['loading', 'error', 'saving'], actions: ['save', 'cancel'], acceptance: ['Name 1..60 chars required', 'Save returns to Pantry with the item in expiry order', 'Failed save keeps input'], basis: ['data.persistence'], entities: ['item'] },
];
export const ENTITIES = [{ id: 'item', fields: { id: 'id', name: 'string(1..60)', quantity: 'int', expires: 'date', usedUp: 'bool' } }];

function write(dir, name, text) { const f = path.join(dir, name); fs.writeFileSync(f, text); return f; }

/** Segment 02 entry: a new standard-mode project with only a one-line idea. */
export function discovery(dir) {
  plan.initProject(dir, 'Pantry Pal', 'standard');
  return { dir, prompt: 'I want an app so my household stops wasting food that expires in the cupboard.' };
}

/** Segment 03 entry: discovery facts known (one inferred), spec archived but not fully mined. */
export function requirements(dir) {
  plan.initProject(dir, 'Pantry Pal', 'standard');
  plan.record(dir, [
    { key: 'product.outcome', value: 'Track food at home so nothing expires unused', source: chat('track what food we have so nothing expires') },
    { key: 'product.audience', value: 'Busy home cooks who shop weekly', status: 'inferred' },
    { key: 'identity.required', value: false, source: chat('no accounts') },
    { key: 'data.required', value: true, source: chat('it has to remember our items') },
  ]);
  plan.addSource(dir, write(dir, 'spec.md', SPEC), 'Pantry Pal spec');
  return { dir, prompt: 'I added our spec (spec.md). Carry on.' };
}

function requirementsDone(dir) {
  plan.initProject(dir, 'Pantry Pal', 'standard');
  plan.record(dir, [
    { key: 'product.outcome', value: 'Track food at home so nothing expires unused', source: chat('track what food we have so nothing expires') },
    { key: 'product.audience', value: 'Busy home cooks who shop weekly', source: chat('busy home cooks') },
    { key: 'product.excluded', value: ['shopping lists', 'barcode scanning', 'household sharing'], source: chat('no shopping lists, scanning or sharing yet') },
    { key: 'identity.required', value: false, source: chat('no accounts') },
    { key: 'data.required', value: true, source: chat('it has to remember our items') },
    { key: 'data.persistence', value: 'device storage (offline)', source: chat('data stays on the phone') },
    { key: 'release.targets', value: ['ios', 'android'], source: chat('iPhone and Android') },
    { key: 'experience.primary', value: 'browse-collection', source: chat('mostly looking at what expires soon') },
  ]);
}

/** Segment 04 entry: requirements complete; navigation, direction and screens not decided. */
export function design(dir) {
  requirementsDone(dir);
  return { dir, prompt: 'Requirements are done. Let\'s design the screens.' };
}

function designDone(dir) {
  requirementsDone(dir);
  plan.record(dir, [
    { key: 'experience.navigation', value: 'Single stack: Pantry pushes Add item; native back', source: chat('one list, push to add') },
    { key: 'design.direction', value: 'Factory Focus-First Native defaults', source: chat('use your defaults') },
  ]);
  plan.setBlueprint(dir, { screens: SCREENS, entities: ENTITIES });
}

/** Segment 05 entry: complete blueprint, no user confirmation yet. */
export function blueprint(dir) {
  designDone(dir);
  return { dir, prompt: 'Looks about right. What do you need from me before building?' };
}

function approved(dir) {
  designDone(dir);
  plan.setBlueprint(dir, { decisions: [{ type: 'user-confirmation', value: 'USER: yes, build it' }] });
  engine.approve(dir);
}

/** Segment 06 entry: approved blueprint, no construction plan. */
export function catalog(dir) {
  approved(dir);
  return { dir, prompt: 'Approved. Plan the build.' };
}

/** Segment 07 entry: plan built; setup tasks done; screens open. */
export function construction(dir) {
  approved(dir);
  plan.planBuild(dir);
  plan.done(dir, 'setup-project', 'npx tsc --noEmit exit 0 on the template');
  plan.done(dir, 'setup-design', 'install-source --all ok; tsc --noEmit exit 0');
  plan.done(dir, 'module-data', 'node --test feature store tests passed; tsc exit 0');
  return { dir, prompt: 'Keep going.' };
}

/** Segment 08 entry: every build task done; verification and release open. */
export function verification(dir) {
  construction(dir);
  for (const s of SCREENS) plan.done(dir, `screen-${s.id}`, 'tsc --noEmit exit 0; expo export --platform android ok');
  return { dir, prompt: 'Is it finished?' };
}

/** Revisit: construction in progress, then the user changes where data lives. */
export function revisit(dir) {
  verification(dir);
  plan.record(dir, { key: 'data.persistence', value: 'Supabase (sync between phones)', source: chat('actually we want it synced to Supabase') });
  return { dir, prompt: 'Actually we want it synced to Supabase so both of us see the same pantry.' };
}

export const SEGMENT_FIXTURES = {
  '02-discovery': discovery,
  '03-requirements': requirements,
  '04-design': design,
  '05-blueprint': blueprint,
  '06-catalog': catalog,
  '07-construction': construction,
  '08-verification': verification,
};
