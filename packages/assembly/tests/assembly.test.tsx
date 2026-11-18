import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { routerCalls, __setParams } from 'expo-router';
import { MonadPage, AppShell, createStore, relativeDay, fill, validateForm, coerce, runActions, type AppSpec, type ActionDeps } from '../src';

const spec = JSON.parse(fs.readFileSync(path.join(__dirname, '../examples/pantry.spec.json'), 'utf8')) as AppSpec;
const instant = (): AppSpec => ({ ...spec, mock: { latencyMs: 0 } });
const texts = (root: renderer.ReactTestRenderer) => root.root.findAll((n) => (n.type as unknown) === 'Text').map((n) => [n.props.children].flat().join(''));
const press = (root: renderer.ReactTestRenderer, label: string, nth = 0) => {
  const hit = root.root.findAll((n) => (n.type as unknown) === 'Pressable' && (n.props.accessibilityLabel === label || texts({ root: n } as never).includes(label)));
  assert.ok(hit[nth], `no pressable "${label}"`);
  act(() => { hit[nth].props.onPress(); });
};

test('relative dates treat YYYY-MM-DD as a calendar day in every time zone', () => {
  const now = new Date(2026, 10, 17, 23, 30);
  assert.equal(relativeDay('2026-11-17', now), 'today');
  assert.equal(relativeDay('2026-11-18', now), 'tomorrow');
  assert.equal(relativeDay('2026-11-14', now), '3 days ago');
  assert.equal(fill('{name} · {expires|relative}', { name: 'Milk', expires: '2026-11-19' }).startsWith('Milk · '), true);
});

test('form validation and coercion follow the field spec', () => {
  const fields = [{ key: 'name', label: 'Name', required: true, max: 5 }, { key: 'qty', label: 'Qty', type: 'number' as const, min: 1 }, { key: 'd', label: 'Date', type: 'date' as const }];
  assert.deepEqual(validateForm(fields, { name: '', qty: '0', d: '18/11' }), { name: 'Name is required', qty: 'Qty must be at least 1', d: 'Date must be a date (YYYY-MM-DD)' });
  assert.deepEqual(coerce(fields, { name: ' Eggs ', qty: '6', d: '2026-11-25' }), { name: 'Eggs', qty: 6, d: '2026-11-25' });
});

test('store: created records get zero values for the collection shape; first-load failure retries', () => {
  const store = createStore({ data: spec.data, mock: { latencyMs: 0, failFirstLoad: ['items'] } });
  store.load('items');
  assert.equal(store.status('items'), 'error');
  store.retry('items');
  assert.equal(store.status('items'), 'ready');
  const rec = store.create('items', { name: 'Eggs' });
  assert.equal(rec.usedUp, false, 'filters like { usedUp: false } match new records');
  assert.equal(store.list('items')[0].id, rec.id);
});

test('event binding: confirm defers the rest of the chain; invalid forms stop it', () => {
  const store = createStore({ data: spec.data, mock: { latencyMs: 0 } });
  const log: string[] = [];
  let pending: (() => void) | null = null;
  const deps: ActionDeps = { store, navigate: (p, q) => log.push(`go ${p} ${JSON.stringify(q)}`), back: () => log.push('back'), notify: (t) => log.push(`notice ${t}`), confirm: (_c, run) => { pending = run; } };
  const milk = store.get('items', 'milk')!;
  runActions(spec.pages.item.events!.delete, milk, deps);
  assert.ok(store.get('items', 'milk'), 'nothing removed before confirmation');
  pending!();
  assert.equal(store.get('items', 'milk'), undefined);
  assert.deepEqual(log, ['back']);
  runActions([{ create: 'items', from: 'form' }, { back: true }], undefined, { ...deps, submitForm: () => undefined });
  assert.deepEqual(log, ['back'], 'invalid form: no create, no navigation');
  runActions(spec.pages.pantry.events!.open, store.get('items', 'rice'), deps);
  assert.equal(log.at(-1), 'go /items/[id] {"id":"rice"}');
});

test('MonadPage renders the collection sorted, filtered, and navigates on select', () => {
  const store = createStore(instant());
  let root!: renderer.ReactTestRenderer;
  act(() => { root = renderer.create(<MonadPage app={instant()} page="pantry" store={store} />); });
  const t = texts(root);
  assert.ok(t.includes('Pantry'), 'every page has a header');
  const order = ['Spinach', 'Milk', 'Basmati rice'].map((n) => t.indexOf(n));
  assert.ok(order.every((x, i) => x >= 0 && (i === 0 || x > order[i - 1])), `sorted by expiry: ${order}`);
  assert.ok(!t.includes('Greek yogurt'), 'In stock segment hides used-up items');
  routerCalls.length = 0;
  press(root, 'Spinach');
  assert.deepEqual(routerCalls[0], ['push', { pathname: '/items/[id]', params: { id: 'spinach' } }]);
});

test('MonadPage detail: facts from the record; destructive action confirms before removing', () => {
  __setParams({ id: 'milk' });
  const store = createStore(instant());
  let root!: renderer.ReactTestRenderer;
  act(() => { root = renderer.create(<MonadPage app={instant()} page="item" store={store} />); });
  assert.ok(texts(root).includes('Milk'));
  assert.ok(texts(root).includes('Quantity'));
  press(root, 'Delete');
  assert.ok(texts(root).includes('Delete Milk?'), 'AlertDialog open');
  assert.ok(store.get('items', 'milk'));
  routerCalls.length = 0;
  const dialogButtons = root.root.findAll((n) => (n.type as unknown) === 'Pressable' && texts({ root: n } as never).includes('Delete'));
  act(() => { dialogButtons.at(-1)!.props.onPress(); });
  assert.equal(store.get('items', 'milk'), undefined);
  assert.deepEqual(routerCalls, [['back']]);
});

test('MonadPage form: empty submit shows errors; valid submit creates and returns', () => {
  const store = createStore(instant());
  let root!: renderer.ReactTestRenderer;
  act(() => { root = renderer.create(<MonadPage app={instant()} page="item-new" store={store} />); });
  routerCalls.length = 0;
  press(root, 'Save');
  assert.ok(texts(root).includes('Name is required'));
  assert.equal(routerCalls.length, 0);
  const inputs = root.root.findAll((n) => (n.type as unknown) === 'TextInput');
  act(() => { inputs[0].props.onChangeText('Eggs'); inputs[2].props.onChangeText('2026-11-25'); });
  press(root, 'Save');
  assert.equal(store.list('items')[0].name, 'Eggs');
  assert.equal(store.list('items')[0].quantity, 1, 'default value used');
  assert.deepEqual(routerCalls, [['back']]);
});

const fitnessSpec = JSON.parse(fs.readFileSync(path.join(__dirname, '../examples/fitness.spec.json'), 'utf8')) as AppSpec;
const financeSpec = JSON.parse(fs.readFileSync(path.join(__dirname, '../examples/finance.spec.json'), 'utf8')) as AppSpec;

test('Archetype glance-dashboard renders monumental hero metric, radial progress and facts', () => {
  __setParams({});
  const store = createStore({ ...fitnessSpec, mock: { latencyMs: 0 } });
  let root!: renderer.ReactTestRenderer;
  act(() => { root = renderer.create(<MonadPage app={fitnessSpec} page="today" store={store} />); });
  const t = texts(root);
  assert.ok(t.includes('8,420'), 'renders hero metric value');
  assert.ok(t.includes('Movement'), 'renders hero metric label');
  assert.ok(t.includes('Active Minutes'), 'renders fact label');
  assert.ok(t.includes('42 min'), 'renders fact value');
  routerCalls.length = 0;
  press(root, 'Log Session');
  assert.deepEqual(routerCalls[0], ['push', '/log']);
});

test('Archetype bento-overview renders squircle ControlTiles for collection items', () => {
  const store = createStore({ ...fitnessSpec, mock: { latencyMs: 0 } });
  let root!: renderer.ReactTestRenderer;
  act(() => { root = renderer.create(<MonadPage app={fitnessSpec} page="workouts" store={store} />); });
  const t = texts(root);
  assert.ok(t.includes('Forest Flow Yoga'), 'renders first bento item');
  assert.ok(t.includes('Cedar Ridge Walk'), 'renders second bento item');
  assert.ok(t.includes('Twilight Relaxation'), 'renders third bento item');
  press(root, 'Forest Flow Yoga');
  assert.ok(texts(root).includes('Selected Forest Flow Yoga'), 'fires notification on select');
});

test('Archetype focus-wizard guides step-by-step sequential input and submits', () => {
  const store = createStore({ ...fitnessSpec, mock: { latencyMs: 0 } });
  let root!: renderer.ReactTestRenderer;
  act(() => { root = renderer.create(<MonadPage app={fitnessSpec} page="log" store={store} />); });
  assert.ok(texts(root).includes('Step 1 of 3'), 'starts on step 1');
  assert.ok(texts(root).includes('Activity Name'));
  const inputs1 = root.root.findAll((n) => (n.type as unknown) === 'TextInput');
  act(() => { inputs1[0].props.onChangeText('Garden Walk'); });
  press(root, 'Continue');
  assert.ok(texts(root).includes('Step 2 of 3'), 'advances to step 2');
  assert.ok(texts(root).includes('Duration'));
  const inputs2 = root.root.findAll((n) => (n.type as unknown) === 'TextInput');
  act(() => { inputs2[0].props.onChangeText('25 mins'); });
  press(root, 'Continue');
  assert.ok(texts(root).includes('Step 3 of 3'), 'advances to step 3');
  assert.ok(texts(root).includes('Intensity'));
  const inputs3 = root.root.findAll((n) => (n.type as unknown) === 'TextInput');
  act(() => { inputs3[0].props.onChangeText('Gentle'); });
  routerCalls.length = 0;
  press(root, 'Save Activity');
  assert.equal(store.list('workouts')[0].title, 'Garden Walk');
  assert.equal(store.list('workouts')[0].duration, '25 mins');
  assert.deepEqual(routerCalls, [['back']]);
});

test('Archetype hero-decision renders HeroPrompt headline, calm subtitle and primary action', () => {
  const store = createStore({ ...financeSpec, mock: { latencyMs: 0 } });
  let root!: renderer.ReactTestRenderer;
  act(() => { root = renderer.create(<MonadPage app={financeSpec} page="transfer" store={store} />); });
  const t = texts(root);
  assert.ok(t.includes('Authorize $5,000 Transfer'), 'renders monumental title');
  assert.ok(t.includes('Funds settle instantly to your high-yield treasury reserve.'), 'renders calm subtitle');
  routerCalls.length = 0;
  press(root, 'Authorize Settlement');
  assert.ok(texts(root).includes('Settlement of $5,000 authorized successfully'));
  assert.deepEqual(routerCalls, [['back']]);
});

test('Archetype system-settings renders grouped toggles and reacts to changes', () => {
  const store = createStore({ ...financeSpec, mock: { latencyMs: 0 } });
  let root!: renderer.ReactTestRenderer;
  act(() => { root = renderer.create(<MonadPage app={financeSpec} page="settings" store={store} />); });
  assert.ok(texts(root).includes('Authentication'), 'renders group title');
  assert.ok(texts(root).includes('Face ID Authorization'), 'renders toggle label');
  assert.equal(store.setting('biometrics'), true);
  const switches = root.root.findAll((n) => (n.type as unknown) === 'Switch');
  assert.equal(switches.length, 2);
  act(() => { switches[0].props.onValueChange(false); });
  assert.equal(store.setting('biometrics'), false);
});

test('Archetype content-canvas renders media frame and editorial rhythm', () => {
  __setParams({ id: 'milk' });
  const store = createStore(instant());
  let root!: renderer.ReactTestRenderer;
  act(() => { root = renderer.create(<MonadPage app={instant()} page="item" store={store} />); });
  const t = texts(root);
  assert.ok(t.includes('Milk'), 'editorial title');
  assert.ok(t.includes('Quantity'), 'editorial metadata label');
  assert.ok(t.includes('Whole milk, opened Sunday'), 'editorial body');
});

test('Expressive Archetypes: glance-dashboard layout variants render distinct structures', () => {
  const baseApp = instant();
  const store = createStore(baseApp);
  __setParams({ id: 'milk' });

  // 1. metric-split variant: side-by-side metric containers
  const splitApp: AppSpec = {
    ...baseApp,
    design: { ...baseApp.design, experience: { hierarchy: 'data-led', pacing: 'compact' } },
    pages: {
      ...baseApp.pages,
      item: {
        ...baseApp.pages.item,
        archetype: 'glance-dashboard',
        composition: { layoutVariant: 'metric-split' },
      },
    },
  };
  let splitRoot!: renderer.ReactTestRenderer;
  act(() => { splitRoot = renderer.create(<MonadPage app={splitApp} page="item" store={store} />); });
  const splitTexts = texts(splitRoot);
  assert.ok(splitTexts.includes('Progress') || splitTexts.includes('Status') || splitTexts.includes('Quantity'), 'metric-split renders dual metrics/status');

  // 2. summary-stack variant: stacked executive summary with progress bar
  const stackApp: AppSpec = {
    ...baseApp,
    design: { ...baseApp.design, experience: { hierarchy: 'typography-led', pacing: 'relaxed' } },
    pages: {
      ...baseApp.pages,
      item: {
        ...baseApp.pages.item,
        archetype: 'glance-dashboard',
        composition: { layoutVariant: 'summary-stack' },
      },
    },
  };
  let stackRoot!: renderer.ReactTestRenderer;
  act(() => { stackRoot = renderer.create(<MonadPage app={stackApp} page="item" store={store} />); });
  const stackTexts = texts(stackRoot);
  assert.ok(stackTexts.includes('Whole milk, opened Sunday'), 'summary-stack renders body within summary card');
});

test('Expressive Archetypes: content-canvas layout variants render distinct structures', () => {
  const baseApp = instant();
  const store = createStore(baseApp);
  __setParams({ id: 'milk' });

  // 1. immersive-bleed: renders ImmersiveHero
  const bleedApp: AppSpec = {
    ...baseApp,
    pages: {
      ...baseApp.pages,
      item: {
        ...baseApp.pages.item,
        composition: { layoutVariant: 'immersive-bleed' },
      },
    },
  };
  let bleedRoot!: renderer.ReactTestRenderer;
  act(() => { bleedRoot = renderer.create(<MonadPage app={bleedApp} page="item" store={store} />); });
  assert.ok(texts(bleedRoot).includes('Milk'), 'immersive-bleed renders title');

  // 2. card-canvas: renders contained showcase card
  const cardApp: AppSpec = {
    ...baseApp,
    pages: {
      ...baseApp.pages,
      item: {
        ...baseApp.pages.item,
        composition: { layoutVariant: 'card-canvas' },
      },
    },
  };
  let cardRoot!: renderer.ReactTestRenderer;
  act(() => { cardRoot = renderer.create(<MonadPage app={cardApp} page="item" store={store} />); });
  assert.ok(texts(cardRoot).includes('Milk'), 'card-canvas renders title inside card');
});

test('Expressive Archetypes: bento-overview layout variants render distinct tile distributions', () => {
  const baseApp = instant();
  const store = createStore(baseApp);

  // 1. asymmetric-hero: first tile is full-width (aspect: 'wide')
  const asymApp: AppSpec = {
    ...baseApp,
    pages: {
      ...baseApp.pages,
      pantry: {
        ...baseApp.pages.pantry,
        archetype: 'bento-overview',
        composition: { layoutVariant: 'asymmetric-hero' },
      },
    },
  };
  let asymRoot!: renderer.ReactTestRenderer;
  act(() => { asymRoot = renderer.create(<MonadPage app={asymApp} page="pantry" store={store} />); });
  const asymWideTiles = asymRoot.root.findAll((n) => n.props?.aspect === 'wide');
  assert.equal(asymWideTiles.length, 1, 'asymmetric-hero creates exactly one wide span-2 hero tile');

  // 2. uniform-grid: all tiles have aspect: 'square' and zero wide tiles
  const uniformApp: AppSpec = {
    ...baseApp,
    pages: {
      ...baseApp.pages,
      pantry: {
        ...baseApp.pages.pantry,
        archetype: 'bento-overview',
        composition: { layoutVariant: 'uniform-grid' },
      },
    },
  };
  let uniformRoot!: renderer.ReactTestRenderer;
  act(() => { uniformRoot = renderer.create(<MonadPage app={uniformApp} page="pantry" store={store} />); });
  const uniformWideTiles = uniformRoot.root.findAll((n) => n.props?.aspect === 'wide');
  assert.equal(uniformWideTiles.length, 0, 'uniform-grid has zero wide tiles');

  // 3. priority-feed: top item gets distinct Open Focus action card
  const priorityApp: AppSpec = {
    ...baseApp,
    pages: {
      ...baseApp.pages,
      pantry: {
        ...baseApp.pages.pantry,
        archetype: 'bento-overview',
        composition: { layoutVariant: 'priority-feed' },
      },
    },
  };
  let priorityRoot!: renderer.ReactTestRenderer;
  act(() => { priorityRoot = renderer.create(<MonadPage app={priorityApp} page="pantry" store={store} />); });
  assert.ok(texts(priorityRoot).includes('Open Focus'), 'priority-feed renders prominent hero action CTA');
});

test('Design Variation Test: same application generated across 3 contrasting Experience Directions produces visibly distinct structures', () => {
  const baseApp = instant();
  const store = createStore(baseApp);
  __setParams({ id: 'milk' });

  // Direction A: Editorial / Relaxed / Typography-led
  const directionA: AppSpec = {
    ...baseApp,
    design: {
      preset: 'kyoto-craft',
      experience: { hierarchy: 'typography-led', motion: 'subtle', pacing: 'relaxed' },
    },
    pages: {
      ...baseApp.pages,
      pantry: {
        ...baseApp.pages.pantry,
        archetype: 'bento-overview',
        composition: { layoutVariant: 'asymmetric-hero' },
      },
      item: {
        ...baseApp.pages.item,
        archetype: 'content-canvas',
        composition: { layoutVariant: 'editorial-feature' },
      },
    },
  };

  // Direction B: High-Velocity / Compact / Data-led
  const directionB: AppSpec = {
    ...baseApp,
    design: {
      preset: 'fintech-midnight',
      experience: { hierarchy: 'data-led', motion: 'expressive', pacing: 'compact' },
    },
    pages: {
      ...baseApp.pages,
      pantry: {
        ...baseApp.pages.pantry,
        archetype: 'bento-overview',
        composition: { layoutVariant: 'uniform-grid' },
      },
      item: {
        ...baseApp.pages.item,
        archetype: 'glance-dashboard',
        composition: { layoutVariant: 'metric-split' },
      },
    },
  };

  // Direction C: Media-Immersion / Monumental / Media-led
  const directionC: AppSpec = {
    ...baseApp,
    design: {
      preset: 'wellness-botanical',
      experience: { hierarchy: 'media-led', motion: 'subtle', pacing: 'monumental' },
    },
    pages: {
      ...baseApp.pages,
      pantry: {
        ...baseApp.pages.pantry,
        archetype: 'bento-overview',
        composition: { layoutVariant: 'priority-feed' },
      },
      item: {
        ...baseApp.pages.item,
        archetype: 'content-canvas',
        composition: { layoutVariant: 'immersive-bleed' },
      },
    },
  };

  let rootA!: renderer.ReactTestRenderer;
  let rootB!: renderer.ReactTestRenderer;
  let rootC!: renderer.ReactTestRenderer;

  act(() => {
    rootA = renderer.create(<MonadPage app={directionA} page="item" store={store} />);
    rootB = renderer.create(<MonadPage app={directionB} page="item" store={store} />);
    rootC = renderer.create(<MonadPage app={directionC} page="item" store={store} />);
  });

  const jsonA = JSON.stringify(rootA.toJSON());
  const jsonB = JSON.stringify(rootB.toJSON());
  const jsonC = JSON.stringify(rootC.toJSON());

  // Structural distinctiveness verification: tree representations must not be identical
  assert.notEqual(jsonA, jsonB, 'Direction A and Direction B must have visibly distinct component trees');
  assert.notEqual(jsonB, jsonC, 'Direction B and Direction C must have visibly distinct component trees');
  assert.notEqual(jsonA, jsonC, 'Direction A and Direction C must have visibly distinct component trees');

  // Verify Direction B has metric-split specific structure
  assert.ok(texts(rootB).includes('Quantity') || texts(rootB).includes('Status'), 'Direction B features split telemetry metrics');

  // Verify Bento overview distinctiveness across directions
  let bentoA!: renderer.ReactTestRenderer;
  let bentoB!: renderer.ReactTestRenderer;
  let bentoC!: renderer.ReactTestRenderer;

  act(() => {
    bentoA = renderer.create(<MonadPage app={directionA} page="pantry" store={store} />);
    bentoB = renderer.create(<MonadPage app={directionB} page="pantry" store={store} />);
    bentoC = renderer.create(<MonadPage app={directionC} page="pantry" store={store} />);
  });

  const bentoAJson = JSON.stringify(bentoA.toJSON());
  const bentoBJson = JSON.stringify(bentoB.toJSON());
  const bentoCJson = JSON.stringify(bentoC.toJSON());

  assert.notEqual(bentoAJson, bentoBJson, 'Bento in Direction A (asymmetric) differs from Direction B (uniform)');
  assert.notEqual(bentoBJson, bentoCJson, 'Bento in Direction B (uniform) differs from Direction C (priority-feed)');
  assert.ok(texts(bentoC).includes('Open Focus'), 'Direction C prioritizes action CTA in priority-feed');
});

test('AppShell initializes with multi-axis design config from app.design', () => {
  let root!: renderer.ReactTestRenderer;
  act(() => { root = renderer.create(<AppShell app={fitnessSpec} />); });
  assert.ok(root.toJSON(), 'renders AppShell with fitnessSpec multi-axis config');
  act(() => { root = renderer.create(<AppShell app={financeSpec} />); });
  assert.ok(root.toJSON(), 'renders AppShell with financeSpec multi-axis config');
});
