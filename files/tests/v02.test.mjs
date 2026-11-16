import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {root,loadCatalog,validate} from '../scripts/lib.mjs';
test('v0.2 library has live showcase for every catalog entry',()=>{
 const list=loadCatalog();assert.ok(list.length>=24);assert.deepEqual(validate(),[]);
 const registry=fs.readFileSync(path.join(root,'apps/lab/showcases/registry.tsx'),'utf8');
 for(const item of list)assert.ok(registry.includes(`${item.showcase}:`),item.id);
});
test('three independent scenario screens import real UI source',()=>{
 for(const id of ['SettingsScenario','SearchScenario','FormScenario']){
  const source=fs.readFileSync(path.join(root,`apps/lab/scenarios/${id}.tsx`),'utf8');
  assert.match(source,/from '@factory\/ui'/);
  assert.ok(source.includes(`export function ${id}`));
 }
});
test('skill instructions do not own production component source',()=>{
 assert.ok(fs.existsSync(path.join(root,'skill/SKILL.md')));
 assert.equal(fs.existsSync(path.join(root,'skill/library')),false);
});
