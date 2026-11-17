import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { installSource, computeDependencyClosure } from '../scripts/install-source.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const libraryDir = path.join(root, 'packages/ui/src');
const registryFile = path.join(root, 'packages/catalog/registry.json');

const work = () => fs.mkdtempSync(path.join(os.tmpdir(), 'factory-installer-test-'));

test('selective installation computes exact dependency closure', () => {
  const dir = work();
  try {
    const res = installSource({
      libraryDir,
      registryFile,
      appDir: dir,
      components: ['controls.button']
    });

    assert.equal(res.dryRun, false);
    assert.equal(res.mode, 'selective');
    assert.ok(res.installedComponents.includes('controls.button'));
    assert.ok(res.installedComponents.includes('primitives.text'));
    // Should NOT have installed unrelated components like Avatar or Checkbox
    assert.ok(!res.installedComponents.includes('composites.avatar'));
    assert.ok(!res.installedComponents.includes('controls.checkbox'));

    // Check files on disk
    const target = path.join(dir, 'src/ui');
    assert.ok(fs.existsSync(path.join(target, 'controls/Button.tsx')));
    assert.ok(fs.existsSync(path.join(target, 'primitives/Text.tsx')));
    assert.ok(fs.existsSync(path.join(target, 'foundation/theme.tsx')));
    assert.ok(fs.existsSync(path.join(target, 'foundation/tokens.ts')));
    assert.ok(fs.existsSync(path.join(target, 'index.ts')));
    assert.ok(!fs.existsSync(path.join(target, 'composites/Avatar.tsx')));

    // Check manifest
    const manifest = JSON.parse(fs.readFileSync(path.join(dir, 'factory-install.json'), 'utf8'));
    assert.equal(manifest.mode, 'selective');
    assert.deepEqual(manifest.requested, ['controls.button']);
    assert.ok(manifest.reasons['primitives/Text.tsx'].some(r => r.includes('imported by controls/Button.tsx')));
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('dry run reports additions and reasons without modifying disk', () => {
  const dir = work();
  try {
    const res = installSource({
      libraryDir,
      registryFile,
      appDir: dir,
      components: ['controls.badge'],
      dryRun: true
    });

    assert.equal(res.dryRun, true);
    assert.ok(res.adds.includes('controls/Badge.tsx'));
    assert.ok(res.adds.includes('primitives/Text.tsx'));
    assert.ok(!fs.existsSync(path.join(dir, 'src/ui')));
    assert.ok(!fs.existsSync(path.join(dir, 'factory-install.json')));
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('conflict detection stops overwrites unless forced', () => {
  const dir = work();
  try {
    // Initial install
    installSource({
      libraryDir,
      registryFile,
      appDir: dir,
      components: ['controls.button']
    });

    // Modify a file in the destination
    const targetFile = path.join(dir, 'src/ui/controls/Button.tsx');
    fs.writeFileSync(targetFile, '// Local customized user modification\nexport const Button = () => null;\n');

    // Attempting reinstall without force must fail
    assert.throws(
      () => installSource({
        libraryDir,
        registryFile,
        appDir: dir,
        components: ['controls.button']
      }),
      /Refusing to overwrite 1 modified UI files/
    );

    // Dry run reports the collision
    const dryRes = installSource({
      libraryDir,
      registryFile,
      appDir: dir,
      components: ['controls.button'],
      dryRun: true
    });
    assert.deepEqual(dryRes.collisions, ['controls/Button.tsx']);

    // Reinstall with force succeeds and overwrites
    const forceRes = installSource({
      libraryDir,
      registryFile,
      appDir: dir,
      components: ['controls.button'],
      force: true
    });
    assert.ok(forceRes.adds.length >= 0);
    assert.ok(fs.readFileSync(targetFile, 'utf8').includes('accessibilityRole="button"'));
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('re-installing identical files is an idempotent no-op', () => {
  const dir = work();
  try {
    const first = installSource({
      libraryDir,
      registryFile,
      appDir: dir,
      components: ['controls.button']
    });
    assert.ok(first.adds.length > 0);

    // Second run with identical files
    const second = installSource({
      libraryDir,
      registryFile,
      appDir: dir,
      components: ['controls.button']
    });
    assert.equal(second.adds.length, 0);
    assert.equal(second.collisions.length, 0);
    assert.ok(second.noops.length > 0);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('installer resolves external npm dependencies and compatible versions', () => {
  const dir = work();
  try {
    const res = installSource({
      libraryDir,
      registryFile,
      appDir: dir,
      components: ['composites.mediaframe', 'patterns.actiondock'],
      dryRun: true
    });

    assert.ok(res.externalDependencies['expo-image']);
    assert.equal(res.externalDependencies['expo-image'], '~58.0.0');
    assert.ok(res.externalDependencies['react-native-safe-area-context']);
    assert.equal(res.externalDependencies['react-native-safe-area-context'], '^5.0.0');
    assert.ok(res.externalReasons['expo-image'].some(r => r.includes('composites/MediaFrame.tsx')));
    assert.ok(res.externalReasons['react-native-safe-area-context'].some(r => r.includes('patterns/ActionDock.tsx')));
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
