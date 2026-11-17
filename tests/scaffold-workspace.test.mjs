import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import * as engine from '../factory-v1/engine.mjs';
import * as planner from '../factory-v1/planner.mjs';
import { scaffoldWorkspace } from '../scripts/scaffold-workspace.mjs';

const fixture = () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'factory-scaffold-test-'));
  engine.init(dir, 'Neighborhood Events');
  engine.update(dir, {
    answers: {
      'product.audience': 'Residents',
      'product.outcome': 'Discover local events',
      'experience.navigation': 'Discover to event details',
      'design.direction': 'Editorial photo-led',
      'identity.required': false,
      'data.required': false,
      'release.targets': ['ios', 'android']
    },
    screens: [{
      id: 'discover', title: 'Discover', purpose: 'Browse events',
      route: '/', components: ['primitives.screen', 'controls.button'],
      states: ['loading', 'ready', 'error'],
      actions: ['Open event details'], acceptance: ['Page renders']
    }],
    decisions: [{ type: 'user-confirmation', value: 'Explicit approval of this test blueprint' }]
  });
  return dir;
};
const cleanup = dir => fs.rmSync(dir, { recursive: true, force: true });

test('scaffold refuses an unapproved project without changing it', () => {
  const dir = fixture();
  try {
    planner.brief(dir);
    assert.throws(() => scaffoldWorkspace(dir), /not approved/);
    assert.equal(fs.existsSync(path.join(dir, 'package.json')), false);
    assert.ok(fs.existsSync(path.join(dir, '.factory/project.json')));
  } finally { cleanup(dir); }
});

test('scaffold requires generated, current documentation', () => {
  const dir = fixture();
  try {
    engine.approve(dir);
    assert.throws(() => scaffoldWorkspace(dir), /Missing documentation/);
    planner.brief(dir);
    fs.writeFileSync(path.join(dir, '.factory/docs/DESIGN.md'), '# Global design (rev -1)');
    assert.throws(() => scaffoldWorkspace(dir), /Stale documentation DESIGN.md/);
    assert.equal(fs.existsSync(path.join(dir, 'package.json')), false);
  } finally { cleanup(dir); }
});

test('scaffold adds Expo files alongside approved documents without overwriting existing work', () => {
  const dir = fixture();
  try {
    engine.approve(dir);
    planner.brief(dir);
    const originalState = fs.readFileSync(path.join(dir, '.factory/project.json'));
    const originalDocs = fs.readFileSync(path.join(dir, '.factory/docs/BRIEF.md'));
    fs.writeFileSync(path.join(dir, 'notes.txt'), 'Keep user notes');
    const result = scaffoldWorkspace(dir);
    assert.equal(result.scaffolded, true);
    assert.ok(result.filesCreated > 5);
    assert.equal(fs.readFileSync(path.join(dir, '.factory/project.json')).equals(originalState), true);
    assert.equal(fs.readFileSync(path.join(dir, '.factory/docs/BRIEF.md')).equals(originalDocs), true);
    assert.equal(fs.readFileSync(path.join(dir, 'notes.txt'), 'utf8'), 'Keep user notes');
    assert.equal(JSON.parse(fs.readFileSync(path.join(dir, 'package.json'), 'utf8')).name, path.basename(dir).toLowerCase());
    assert.equal(JSON.parse(fs.readFileSync(path.join(dir, 'app.json'), 'utf8')).expo.name, 'Neighborhood Events');
    assert.ok(fs.existsSync(path.join(dir, 'src/ui/index.ts')));
    assert.ok(fs.existsSync(path.join(dir, 'factory-install.json')));
    assert.throws(() => scaffoldWorkspace(dir), /already scaffolded/);
  } finally { cleanup(dir); }
});

test('scaffold fails on conflicting app files without modifying the workspace', () => {
  const dir = fixture();
  try {
    engine.approve(dir);
    planner.brief(dir);
    const collision = path.join(dir, 'app.json');
    fs.writeFileSync(collision, 'Existing app configuration');
    assert.throws(() => scaffoldWorkspace(dir), /would overwrite existing files/);
    assert.equal(fs.readFileSync(collision, 'utf8'), 'Existing app configuration');
    assert.equal(fs.existsSync(path.join(dir, 'package.json')), false);
    assert.equal(fs.existsSync(path.join(dir, 'src/ui/index.ts')), false);
  } finally { cleanup(dir); }
});

test('documentation projections include design and interactions with current revision', () => {
  const dir = fixture();
  try {
    const rev = engine.load(dir).revision;
    planner.brief(dir);
    const base = path.join(dir, '.factory/docs');
    assert.match(fs.readFileSync(path.join(base, 'DESIGN.md'), 'utf8'), new RegExp('rev ' + rev));
    const events = fs.readFileSync(path.join(base, 'INTERACTIONS.md'), 'utf8');
    assert.match(events, /Open event details/);
    assert.match(events, /Route: \/?/);
  } finally { cleanup(dir); }
});
