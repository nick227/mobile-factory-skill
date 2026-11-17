import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { routerCalls, __setParams } from 'expo-router';
import { MonadPage, createStore, relativeDay, fill, validateForm, coerce, runActions, type AppSpec, type ActionDeps } from '../src';

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
