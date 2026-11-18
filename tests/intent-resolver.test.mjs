import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import * as plan from '../factory-v1/planner.mjs';
import * as engine from '../factory-v1/engine.mjs';
import * as editorial from '../factory-v1/editorial.mjs';
import * as generator from '../factory-v1/generate.mjs';
import { resolveIntent, applyResolvedIntent } from '../factory-v1/intent-resolver.mjs';

test('Intent Resolver: resolves operational logging intent to functional tracker workflow', () => {
  const intent = {
    subjects: ['roast'],
    actions: ['browse', 'log'],
  };
  const visual = {
    preset: 'minimal-pro',
    palette: 'amber',
    hierarchy: 'media-led',
    motion: 'subtle',
    pacing: 'compact',
  };

  const resolved = resolveIntent(intent, visual, { title: 'Coffee Notes' });

  assert.equal(resolved.classification.type, 'tracker');
  assert.deepEqual(resolved.objects, ['roast']);
  assert.deepEqual(resolved.functionality, ['roast.view', 'roast.create']);
  assert.deepEqual(resolved.pages, ['tracker.home', 'tracker.detail', 'tracker.create']);
  assert.ok(resolved.composition['tracker.home'].navigation.some((n) => n.to === 'tracker.create' && n.placement === 'header'));
  assert.ok(resolved.composition['tracker.create'].actions.some((a) => a.id === 'roast.create' && a.placement === 'primary'));
  assert.equal(resolved.primaryWorkflow.isInteractive, true);
  assert.equal(resolved.primaryWorkflow.subject, 'roast');
  assert.ok(resolved.content.data.roast.length >= 2);
});

test('Intent Resolver: resolves browse-only intent to catalog workflow', () => {
  const intent = {
    subjects: ['bean'],
    actions: ['browse'],
  };
  const visual = {
    preset: 'editorial-luxury',
    palette: 'slate',
  };

  const resolved = resolveIntent(intent, visual, { title: 'Bean Catalog' });

  assert.equal(resolved.classification.type, 'catalog');
  assert.deepEqual(resolved.objects, ['bean']);
  assert.deepEqual(resolved.functionality, ['bean.view']);
  assert.deepEqual(resolved.pages, ['catalog.home', 'catalog.detail']);
  assert.equal(resolved.primaryWorkflow.isInteractive, false);
});

test('Intent Resolver: rejects unsupported actions without silent fallbacks', () => {
  assert.throws(
    () => resolveIntent({ subjects: ['bean'], actions: ['crypto-mine'] }),
    /unsupported action "crypto-mine"/
  );
});

test('Intent Resolver: rejects empty subjects', () => {
  assert.throws(
    () => resolveIntent({ subjects: [], actions: ['view'] }),
    /must declare at least one subject/
  );
});

test('Intent Resolver: applyResolvedIntent applies all batches and generates working application', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'intent-app-'));
  plan.initProject(dir, 'Artisan Pantry', 'lite');

  const { resolved, apiOperations, specHash } = applyResolvedIntent(
    dir,
    { subjects: ['ingredient'], actions: ['browse', 'record'] },
    { preset: 'wellness-botanical', palette: 'emerald', pacing: 'relaxed' },
    { title: 'Artisan Pantry' }
  );

  assert.ok(specHash);
  assert.equal(apiOperations.length, 8); // init + 7 batches

  const project = engine.load(dir);
  project.decisions = [
    {
      type: 'user-confirmation',
      value: 'USER: I approve this botanical plan',
      revision: project.revision,
      appSpecHash: specHash,
    },
  ];
  engine.save(dir, project);
  engine.approve(dir);

  const gen = generator.generate(dir);
  assert.equal(gen.ok, true);
  assert.equal(gen.mode, 'create');
  assert.ok(fs.existsSync(path.join(dir, 'app/index.tsx')));
  assert.ok(fs.existsSync(path.join(dir, 'app/records/[id].tsx')));
  assert.ok(fs.existsSync(path.join(dir, 'app/records/new.tsx')));

  // Clean up
  fs.rmSync(dir, { recursive: true, force: true });
});
