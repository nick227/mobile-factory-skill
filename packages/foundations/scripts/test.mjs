// Compile the React-Native-free logic to CommonJS and run it with node --test.
// These are real behaviour tests of pure logic; they are not device evidence.
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const pkg = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = path.join(pkg, '.test-build');
fs.rmSync(out, { recursive: true, force: true });
const tsc = path.join(pkg, 'node_modules/typescript/bin/tsc');
const build = spawnSync(process.execPath, [tsc, '-p', path.join(pkg, 'tsconfig.test.json')], { stdio: 'inherit' });
if (build.status !== 0) process.exit(build.status ?? 1);
fs.writeFileSync(path.join(out, 'package.json'), '{"type":"commonjs"}\n');
const files = fs.readdirSync(path.join(out, 'tests')).filter((f) => f.endsWith('.test.js')).map((f) => path.join(out, 'tests', f));
const run = spawnSync(process.execPath, ['--test', ...files], { stdio: 'inherit' });
process.exit(run.status ?? 1);
