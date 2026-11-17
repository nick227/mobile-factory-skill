// Tests for factory content and editorial quality validator (factory-v1/content.mjs)
import test from 'node:test';
import assert from 'node:assert/strict';
import * as content from '../factory-v1/content.mjs';

test('content linter catches prohibited buzzwords', () => {
  const issues = content.lintCopy('A seamless and revolutionary experience for your kitchen', 'heading');
  assert.equal(issues.length, 2);
  assert.ok(issues[0].includes('seamless'));
  assert.ok(issues[1].includes('revolutionary'));
});

test('content linter accepts clear, direct user language', () => {
  const issues = content.lintCopy('Track food expiry dates so nothing goes to waste.', 'heading');
  assert.deepEqual(issues, []);
});

test('content auditor validates microcopy character budgets and exceptional states', () => {
  const badSpec = {
    pages: {
      home: {
        route: '/',
        title: 'Home',
        headerAction: { label: 'Go Directly to Application Configuration Settings', event: 'settings' },
        primary: { label: 'Click Here to Submit All Details Now Immediately', event: 'submit' },
        empty: {
          title: 'This empty state title is far too long to fit comfortably on any standard mobile viewport display',
          description: 'A brief description',
        },
        subject: { kind: 'collection', source: 'items' },
        events: {
          delete: [{ remove: 'items' }], // destructive remove without confirm
        },
      },
    },
  };

  const r = content.auditContent({ spec: badSpec });
  assert.equal(r.ok, false);
  assert.ok(r.errors.some((e) => e.includes("destructive 'remove' action must be guarded")));
  assert.ok(r.warnings.some((w) => w.includes('headerAction.label') && w.includes('exceeds')));
  assert.ok(r.warnings.some((w) => w.includes('primary.label') && w.includes('exceeds')));
  assert.ok(r.warnings.some((w) => w.includes('empty.title: exceeds')));
});

test('content auditor verifies project screen states', () => {
  const project = {
    screens: [
      { id: 'home', title: 'Home', purpose: 'Home screen', states: ['ready'], actions: ['delete'] },
    ],
  };

  const r = content.auditContent({ project });
  assert.equal(r.ok, false);
  assert.ok(r.errors.some((e) => e.includes("must declare 'loading' and 'error' states")));
  assert.ok(r.warnings.some((w) => w.includes('contains destructive action')));
});
