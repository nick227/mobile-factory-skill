import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {validate,loadCatalog,root} from '../scripts/lib.mjs';
test('strict catalog source and taxonomy invariants',()=>assert.deepEqual(validate(),[]));
test('representative taxonomy breadth',()=>{
 const entries=loadCatalog();assert.ok(entries.length>=5);
 for(const category of ['primitives','controls','composites','patterns'])assert.ok(entries.some(item=>item.category===category));
});
test('skill and app template exist independently',()=>{
 assert.ok(fs.existsSync(path.join(root,'skill/SKILL.md')));
 assert.ok(fs.existsSync(path.join(root,'templates/expo-app/app/index.tsx')));
});
