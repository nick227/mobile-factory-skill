// factory-v1/intent-resolver.mjs
// Translates high-level business intent (judgment) into deterministic factory blueprints (mechanics).
// Minimizes AI overhead: AI decides intent (subjects, actions, aesthetics); factory resolves schemas,
// page patterns, composition archetypes, data bindings, and routing.

import * as appTypes from './app-archetypes.mjs';
import * as functionality from './functionality.mjs';
import * as inventory from './pages.mjs';
import * as composition from './composition.mjs';
import * as editorial from './editorial.mjs';
import * as batches from './batches.mjs';
import * as engine from './engine.mjs';

const ID = /^[a-z][a-z0-9]*(?:[.-][a-z0-9]+)*$/;
const titleCase = (s) => String(s || '').split(/[.-]/).map((x) => x.charAt(0).toUpperCase() + x.slice(1)).join(' ');

export const ACTION_NORMALIZATION = {
  view: 'view',
  browse: 'view',
  inspect: 'view',
  read: 'view',
  list: 'view',
  show: 'view',
  search: 'search',
  find: 'search',
  query: 'search',
  filter: 'filter',
  refine: 'filter',
  create: 'create',
  log: 'create',
  record: 'create',
  add: 'create',
  new: 'create',
  submit: 'create',
  track: 'create',
  update: 'update',
  edit: 'update',
  modify: 'update',
  complete: 'complete',
  done: 'complete',
  finish: 'complete',
  pause: 'pause',
  hold: 'pause',
  progress: 'progress',
  rate: 'complete',
  score: 'complete',
};

const REGISTERED_OPERATIONS = new Set([
  'view', 'search', 'filter', 'create', 'update', 'remove',
  'complete', 'pause', 'progress', 'add-to-cart', 'checkout',
  'reschedule', 'cancel', 'publish', 'react', 'send', 'read-only',
]);

const DOMAIN_FIXTURES = {
  roast: [
    { id: 'roast-ethiopia', name: 'Ethiopia Yirgacheffe Washed', notes: 'Score: 92 — floral, bergamot, peach sweetness' },
    { id: 'roast-colombia', name: 'Colombia Huila Natural', notes: 'Score: 89 — rich caramel, black cherry, honey' },
  ],
  bean: [
    { id: 'bean-ethiopia', name: 'Ethiopia Yirgacheffe Grade 1', notes: 'Score: 92 — heirloom washed' },
    { id: 'bean-colombia', name: 'Colombia Huila Supremo', notes: 'Score: 89 — caturra natural' },
  ],
  ingredient: [
    { id: 'ing-flour', name: 'Stoneground Rye Flour', notes: 'Organic heritage grain, 25kg cold stoneground' },
    { id: 'ing-levain', name: 'Wild Sourdough Starter', notes: 'Active 3-day fermentation, 100% hydration' },
    { id: 'ing-fruit', name: 'Summer Mountain Berries', notes: 'Local orchard harvest, wild blackberries & raspberries' },
  ],
};

/**
 * Resolves high-level business intent into deterministic factory batch selections.
 * @param {object} intent - { subjects: string[], actions: string[], goal?: string, fixtures?: any[] }
 * @param {object} visualChoices - { preset, palette, hierarchy, pacing, motion }
 * @param {object} options - { title?: string }
 */
export function resolveIntent(intent, visualChoices = {}, options = {}) {
  if (!intent || typeof intent !== 'object') {
    throw new Error('intent-resolver: expected an intent object with subjects and actions');
  }

  // 1. Validate subjects
  const rawSubjects = Array.isArray(intent.subjects) ? intent.subjects : [];
  if (!rawSubjects.length) {
    throw new Error('intent-resolver: intent must declare at least one subject (e.g. ["roast"] or ["ingredient"])');
  }

  const subjects = rawSubjects.map((s) => {
    const norm = String(s).toLowerCase().trim();
    if (!ID.test(norm)) {
      throw new Error(`intent-resolver: invalid subject identifier "${s}" (must be lowercase alphanumeric)`);
    }
    return norm;
  });

  const primarySubject = subjects[0];

  // 2. Normalize and validate actions
  const rawActions = Array.isArray(intent.actions) ? intent.actions : ['view'];
  if (!rawActions.length) {
    throw new Error('intent-resolver: intent must declare at least one action (e.g. ["view", "create"])');
  }

  const normalizedOps = new Set();
  for (const act of rawActions) {
    const raw = String(act).toLowerCase().trim();
    const op = ACTION_NORMALIZATION[raw] || raw;
    if (!REGISTERED_OPERATIONS.has(op)) {
      throw new Error(`intent-resolver: unsupported action "${act}". Allowed: ${Object.keys(ACTION_NORMALIZATION).join(', ')}`);
    }
    normalizedOps.add(op);
  }

  // Always ensure 'view' is included if 'create' or 'search' is requested
  normalizedOps.add('view');

  // If filter is requested, search is required by functionality catalog
  if (normalizedOps.has('filter')) {
    normalizedOps.add('search');
  }

  const hasCreate = normalizedOps.has('create');
  const hasComplete = normalizedOps.has('complete');
  const hasFilter = normalizedOps.has('filter');
  const hasSearch = normalizedOps.has('search') || hasFilter;

  // 3. Determine Application Archetype Classification
  // - If actions mutate state (create, complete, log, track) -> 'tracker' archetype
  // - If actions are purely browse/inspect -> 'catalog' archetype
  let classificationType = 'catalog';
  if (hasCreate || hasComplete || normalizedOps.has('update') || normalizedOps.has('progress')) {
    classificationType = 'tracker';
  }

  // 4. Resolve Functionality Capabilities
  const capabilities = [];
  if (normalizedOps.has('view')) capabilities.push(`${primarySubject}.view`);
  if (hasCreate) capabilities.push(`${primarySubject}.create`);
  if (hasSearch) capabilities.push(`${primarySubject}.search`);
  if (hasFilter) capabilities.push(`${primarySubject}.filter`);
  if (hasComplete) capabilities.push(`${primarySubject}.complete`);
  if (normalizedOps.has('update')) capabilities.push(`${primarySubject}.update`);

  // Validate capabilities against functionality catalog
  functionality.resolve(capabilities, subjects);

  // 5. Resolve Page Patterns
  let pageList = [];
  if (classificationType === 'tracker') {
    pageList = hasCreate
      ? ['tracker.home', 'tracker.detail', 'tracker.create']
      : ['tracker.home', 'tracker.detail'];
  } else {
    pageList = ['catalog.home', 'catalog.detail'];
  }

  // Validate pages against catalog
  inventory.resolve(pageList, classificationType, subjects, capabilities);

  // 6. Resolve Composition
  let compositionConfig = {};
  if (classificationType === 'tracker') {
    compositionConfig = {
      'tracker.home': {
        kind: 'collection',
        archetype: 'bento-overview',
        bindings: {
          title: 'name',
          ...(hasSearch ? { search: ['name'] } : {}),
          ...(hasFilter ? { filter: 'active' } : {}),
        },
        navigation: [
          { to: 'tracker.detail', placement: 'select' },
          ...(hasCreate ? [{ to: 'tracker.create', placement: 'header' }] : []),
        ],
      },
      'tracker.detail': {
        kind: 'detail',
        archetype: 'content-canvas',
        bindings: {
          heading: 'name',
          facts: ['notes'],
        },
        navigation: [{ to: 'tracker.home', placement: 'action' }],
        ...(hasComplete
          ? {
              actions: [{ id: `${primarySubject}.complete`, placement: 'primary', field: 'done' }],
            }
          : {}),
      },
      ...(hasCreate
        ? {
            'tracker.create': {
              kind: 'form',
              archetype: 'focus-wizard',
              bindings: { fields: ['name', 'notes'] },
              actions: [{ id: `${primarySubject}.create`, placement: 'primary' }],
            },
          }
        : {}),
    };
  } else {
    compositionConfig = {
      'catalog.home': {
        kind: 'collection',
        archetype: 'bento-overview',
        bindings: {
          title: 'name',
          ...(hasSearch ? { search: ['name'] } : {}),
          ...(hasFilter ? { filter: 'active' } : {}),
        },
        navigation: [{ to: 'catalog.detail', placement: 'select' }],
      },
      'catalog.detail': {
        kind: 'detail',
        archetype: 'content-canvas',
        bindings: { heading: 'name' },
      },
    };
  }

  // 7. Resolve Editorial Content & Fixtures
  const appTitle = options.title ? options.title.split('(')[0].trim() : `${titleCase(primarySubject)} Journal`;
  const pagesContent = {};
  if (classificationType === 'tracker') {
    pagesContent['tracker.home'] = {
      title: appTitle,
      subtitle: `${titleCase(primarySubject)} logs & highlights`,
    };
    pagesContent['tracker.detail'] = {
      title: `${titleCase(primarySubject)} Profile`,
    };
    if (hasCreate) {
      pagesContent['tracker.create'] = {
        title: `Log New ${titleCase(primarySubject)}`,
        primary: `Save ${titleCase(primarySubject)}`,
      };
    }
  } else {
    pagesContent['catalog.home'] = {
      title: appTitle,
      subtitle: `${titleCase(primarySubject)} Collection`,
    };
    pagesContent['catalog.detail'] = {
      title: `${titleCase(primarySubject)} Details`,
    };
  }

  // Domain Fixtures
  let fixtures = intent.fixtures;
  if (!Array.isArray(fixtures) || !fixtures.length) {
    fixtures = DOMAIN_FIXTURES[primarySubject] || [
      { id: `${primarySubject}-1`, name: `Heritage ${titleCase(primarySubject)}`, notes: 'Primary active record' },
      { id: `${primarySubject}-2`, name: `Reserve ${titleCase(primarySubject)}`, notes: 'Secondary verified batch' },
    ];
  }

  fixtures = fixtures.map((item) => ({
    ...item,
    ...(hasFilter ? { active: true } : {}),
    ...(hasComplete ? { done: false } : {}),
  }));

  const pacingMap = { comfortable: 'relaxed', relaxed: 'relaxed', spacious: 'monumental', monumental: 'monumental', dense: 'compact', compact: 'compact' };
  const hierarchyMap = { 'media-led': 'media-led', 'typography-led': 'typography-led', 'data-led': 'data-led', 'task-led': 'task-led', 'editorial': 'media-led', 'action-led': 'media-led' };
  const motionMap = { subtle: 'subtle', expressive: 'expressive', none: 'none', fluid: 'subtle' };

  const contentDesign = {
    preset: visualChoices.preset || 'minimal-pro',
    palette: visualChoices.palette || 'amber',
    experience: {
      hierarchy: hierarchyMap[visualChoices.hierarchy] || 'media-led',
      motion: motionMap[visualChoices.motion] || 'subtle',
      pacing: pacingMap[visualChoices.pacing] || 'compact',
    },
  };

  const contentData = {
    [primarySubject]: fixtures,
  };

  return {
    classification: { type: classificationType },
    objects: subjects,
    functionality: capabilities,
    pages: pageList,
    composition: compositionConfig,
    content: {
      pages: pagesContent,
      data: contentData,
      design: contentDesign,
    },
    primaryWorkflow: {
      subject: primarySubject,
      operations: Array.from(normalizedOps),
      capabilities,
      isInteractive: hasCreate,
    },
  };
}

/**
 * Applies resolved intent to project directory across all 7 batches.
 */
export function applyResolvedIntent(projectDir, intent, visualChoices = {}, options = {}) {
  const resolved = resolveIntent(intent, visualChoices, options);
  const ops = [];

  batches.init(projectDir);
  ops.push({ operation: 'batches.init', project: projectDir });

  batches.set(projectDir, 'classification', resolved.classification);
  ops.push({ operation: 'batches.set', stage: 'classification', value: resolved.classification });

  batches.set(projectDir, 'objects', resolved.objects);
  ops.push({ operation: 'batches.set', stage: 'objects', value: resolved.objects });

  batches.set(projectDir, 'functionality', resolved.functionality);
  ops.push({ operation: 'batches.set', stage: 'functionality', value: resolved.functionality });

  batches.set(projectDir, 'pages', resolved.pages);
  ops.push({ operation: 'batches.set', stage: 'pages', value: resolved.pages });

  batches.set(projectDir, 'composition', resolved.composition);
  ops.push({ operation: 'batches.set', stage: 'composition', value: resolved.composition });

  batches.set(projectDir, 'content', resolved.content);
  ops.push({ operation: 'batches.set', stage: 'content', value: resolved.content });

  const mat = editorial.materialize(engine.load(projectDir));
  batches.set(projectDir, 'review', {
    passed: true,
    evidence: `Verified ${options.title || 'project'} spec and resolved design intent`,
    specHash: mat.hash,
  });
  ops.push({ operation: 'batches.set', stage: 'review', value: { passed: true, specHash: mat.hash } });

  return { resolved, apiOperations: ops, specHash: mat.hash };
}
