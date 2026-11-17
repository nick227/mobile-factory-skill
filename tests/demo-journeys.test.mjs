// Runs the Lab demo journey tests (pure state models, real logic, no mocks) under tsx.
import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import fs from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
test('Lab demo journeys (tests/demos/*.test.ts)', { skip: !fs.existsSync(path.join(root, 'node_modules/.bin/tsx')) && 'run pnpm install first' }, () => {
  const files = fs.readdirSync(path.join(root, 'tests/demos')).filter((f) => f.endsWith('.test.ts')).map((f) => path.join('tests/demos', f));
  const r = spawnSync(path.join(root, 'node_modules/.bin/tsx'), ['--test', ...files], { cwd: root, encoding: 'utf8' });
  assert.equal(r.status, 0, r.stdout.slice(-4000) + r.stderr.slice(-2000));
});
