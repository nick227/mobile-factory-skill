#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const EXTENSIONS = ['.tsx', '.ts', '.jsx', '.js'];

export function resolveImport(sourceFile, specifier, libraryRoot) {
  if (!specifier.startsWith('.')) return null;
  const base = path.resolve(path.dirname(sourceFile), specifier);
  for (const ext of EXTENSIONS) {
    const candidate = base + ext;
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
      return candidate;
    }
  }
  for (const ext of EXTENSIONS) {
    const candidate = path.join(base, 'index' + ext);
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
      return candidate;
    }
  }
  if (fs.existsSync(base) && fs.statSync(base).isFile()) {
    return base;
  }
  return null;
}

export function extractRelativeImports(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const matches = [...content.matchAll(/(?:import|export)\s+(?:[^'";]*?\s+from\s+)?['"]([^'"]+)['"]/g)];
  return matches.map(m => m[1]).filter(s => s.startsWith('.'));
}

export function extractExternalImports(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const matches = [...content.matchAll(/(?:import|export)\s+(?:[^'";]*?\s+from\s+)?['"]([^'"]+)['"]/g)];
  const externals = new Set();
  for (const m of matches) {
    const spec = m[1];
    if (spec.startsWith('.') || spec.startsWith('/') || spec.startsWith('node:')) continue;
    const parts = spec.split('/');
    const pkg = spec.startsWith('@') ? `${parts[0]}/${parts[1]}` : parts[0];
    if (pkg !== 'react' && pkg !== 'react-native' && pkg !== '@factory/ui' && pkg !== '@factory/catalog') {
      externals.add(pkg);
    }
  }
  return [...externals].sort();
}

export function getCompatibleDependencyVersions(libraryRoot) {
  const pkgPath = path.resolve(libraryRoot, '..', 'package.json');
  if (fs.existsSync(pkgPath)) {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    return { ...pkg.dependencies, ...pkg.peerDependencies };
  }
  return {};
}

export function computeDependencyClosure(entryFiles, libraryRoot) {
  const closure = new Set();
  const reasons = new Map();
  const queue = [];

  for (const { file, reason } of entryFiles) {
    const resolved = path.resolve(file);
    const rel = path.relative(libraryRoot, resolved).replaceAll('\\', '/');
    closure.add(resolved);
    if (!reasons.has(rel)) reasons.set(rel, new Set());
    reasons.get(rel).add(reason);
    queue.push(resolved);
  }

  while (queue.length > 0) {
    const current = queue.shift();
    const currentRel = path.relative(libraryRoot, current).replaceAll('\\', '/');
    const importSpecifiers = extractRelativeImports(current);

    for (const spec of importSpecifiers) {
      const depFile = resolveImport(current, spec, libraryRoot);
      if (depFile && depFile.startsWith(path.resolve(libraryRoot))) {
        const depRel = path.relative(libraryRoot, depFile).replaceAll('\\', '/');
        if (!reasons.has(depRel)) reasons.set(depRel, new Set());
        reasons.get(depRel).add(`imported by ${currentRel}`);

        if (!closure.has(depFile)) {
          closure.add(depFile);
          queue.push(depFile);
        }
      }
    }
  }

  return {
    files: [...closure].sort(),
    reasons: Object.fromEntries([...reasons.entries()].map(([k, v]) => [k, [...v].sort()]))
  };
}

export function installSource({
  libraryDir,
  registryFile,
  appDir,
  all = false,
  components = [],
  force = false,
  dryRun = false
}) {
  const library = path.resolve(libraryDir);
  const target = path.join(path.resolve(appDir), 'src/ui');
  const catalog = JSON.parse(fs.readFileSync(path.resolve(registryFile), 'utf8'));

  if (!all && (!components || !components.length)) {
    throw new Error('Specify all=true or provide a non-empty components array');
  }

  const ids = new Set(catalog.map(x => x.id));
  for (const item of components) {
    if (!ids.has(item)) throw new Error(`Unknown component: ${item}`);
  }

  const allowed = new Set(catalog.filter(x => ['stable', 'preview', 'implemented', 'verified', 'recommended'].includes(x.status)).map(x => x.id));
  for (const id of components) {
    if (!allowed.has(id)) {
      const isCandidate = catalog.some(x => x.id === id && (x.status === 'candidate' || x.status === 'development'));
      if (isCandidate) {
        throw new Error(`Cannot install candidate component '${id}': implementation does not exist yet. Must be implemented before installation.`);
      }
      throw new Error(`Cannot install development/unapproved component: ${id}`);
    }
  }

  let closureFiles = [];
  let reasons = {};

  if (all) {
    function walk(dir) {
      const out = [];
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) out.push(...walk(full));
        else if (/\.(tsx?|jsx?)$/.test(entry.name)) out.push(full);
      }
      return out;
    }
    closureFiles = walk(library).filter(f => path.basename(f) !== 'index.ts');
    reasons = Object.fromEntries(
      closureFiles.map(f => [path.relative(library, f).replaceAll('\\', '/'), ['--all approved source']])
    );
  } else {
    const entryFiles = [];
    for (const compId of components) {
      const meta = catalog.find(x => x.id === compId);
      const fullPath = path.join(library, meta.source);
      if (!fs.existsSync(fullPath)) throw new Error(`Source file missing for ${compId}: ${meta.source}`);
      entryFiles.push({ file: fullPath, reason: `requested component ${compId}` });
    }
    const computed = computeDependencyClosure(entryFiles, library);
    closureFiles = computed.files;
    reasons = computed.reasons;
  }

  const relativeClosure = closureFiles.map(f => path.relative(library, f).replaceAll('\\', '/'));
  const installedComponents = catalog
    .filter(c => relativeClosure.includes(c.source.replaceAll('\\', '/')))
    .map(c => c.id);

  const adds = [];
  const noops = [];
  const collisions = [];

  for (const file of closureFiles) {
    const rel = path.relative(library, file).replaceAll('\\', '/');
    const destFile = path.join(target, rel);
    if (fs.existsSync(destFile)) {
      const srcBuf = fs.readFileSync(file);
      const destBuf = fs.readFileSync(destFile);
      if (srcBuf.equals(destBuf)) {
        noops.push(rel);
      } else {
        collisions.push(rel);
      }
    } else {
      adds.push(rel);
    }
  }

  const allKnownVersions = getCompatibleDependencyVersions(library);
  const externalDependencies = {};
  const externalReasons = {};
  for (const file of closureFiles) {
    const rel = path.relative(library, file).replaceAll('\\', '/');
    const externals = extractExternalImports(file);
    for (const ext of externals) {
      const version = allKnownVersions[ext] ?? '*';
      externalDependencies[ext] = version;
      if (!externalReasons[ext]) externalReasons[ext] = [];
      externalReasons[ext].push(`imported by ${rel}`);
    }
  }

  const result = {
    dryRun,
    mode: all ? 'full-approved-source' : 'selective',
    target: target.replaceAll('\\', '/'),
    adds,
    noops,
    collisions,
    installedComponents,
    reasons,
    externalDependencies,
    externalReasons
  };

  if (dryRun) {
    return result;
  }

  if (collisions.length > 0 && !force) {
    throw new Error(`Refusing to overwrite ${collisions.length} modified UI files (${collisions.slice(0, 3).join(', ')}${collisions.length > 3 ? '...' : ''}). Use --force explicitly.`);
  }

  fs.mkdirSync(target, { recursive: true });

  for (const file of closureFiles) {
    const rel = path.relative(library, file);
    const destFile = path.join(target, rel);
    fs.mkdirSync(path.dirname(destFile), { recursive: true });
    fs.copyFileSync(file, destFile);
  }

  const indexExports = [];
  for (const comp of catalog) {
    if (relativeClosure.includes(comp.source.replaceAll('\\', '/'))) {
      const relWithoutExt = comp.source.replace(/\.(tsx?|jsx?)$/, '').replaceAll('\\', '/');
      indexExports.push(`export * from './${relWithoutExt}';`);
    }
  }
  for (const foundationName of ['tokens', 'theme']) {
    const found = relativeClosure.find(f => f.startsWith('foundation/' + foundationName));
    if (found) {
      const relWithoutExt = found.replace(/\.(tsx?|jsx?)$/, '');
      const exportStmt = `export * from './${relWithoutExt}';`;
      if (!indexExports.includes(exportStmt)) indexExports.unshift(exportStmt);
    }
  }

  fs.writeFileSync(path.join(target, 'index.ts'), indexExports.sort().join('\n') + '\n');

  const manifest = {
    installedAt: new Date().toISOString(),
    source: 'mobile-software-factory',
    mode: result.mode,
    requested: all ? ['all'] : components,
    installedComponents,
    files: [...relativeClosure, 'index.ts'].sort(),
    reasons,
    externalDependencies,
    externalReasons
  };
  fs.writeFileSync(path.join(path.resolve(appDir), 'factory-install.json'), JSON.stringify(manifest, null, 2) + '\n');

  return { ...result, totalFilesInstalled: closureFiles.length + 1 };
}

// CLI entry point
const isCli = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isCli) {
  const [src, registryPath, dest, ...flags] = process.argv.slice(2);
  if (!src || !registryPath || !dest) {
    console.error('Usage: node install-source.mjs <library-dir> <catalog.json> <app-dir> [--all|--components=id1,id2] [--force] [--dry-run]');
    process.exit(1);
  }

  const all = flags.includes('--all');
  const selected = (flags.find(x => x.startsWith('--components=')) ?? '')
    .split('=')[1]
    ?.split(',')
    .filter(Boolean) ?? [];
  const force = flags.includes('--force');
  const dryRun = flags.includes('--dry-run');

  try {
    const outcome = installSource({
      libraryDir: src,
      registryFile: registryPath,
      appDir: dest,
      all,
      components: selected,
      force,
      dryRun
    });

    if (dryRun) {
      console.log(JSON.stringify(outcome, null, 2));
    } else {
      console.log(`Installed ${outcome.adds.length} new files, ${outcome.noops.length} identical files to ${outcome.target}`);
    }
  } catch (err) {
    console.error(`ERROR: ${err.message}`);
    process.exit(1);
  }
}
