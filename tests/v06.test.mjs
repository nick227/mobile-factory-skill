import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {root,loadCatalog,validate} from '../scripts/lib.mjs';
const catalog=loadCatalog();
test('v0.6 source and taxonomy complete',()=>{ assert.deepEqual(validate(),[]); assert.equal(catalog.length,32); });
test('all new focus-first components are still marked preview',()=>{
 for(const n of ['FocusScreen','StepProgress','InputStage','ActionDock','CalmSkeleton','MediaFrame','SwipePager','ScreenHeader']) assert.equal(catalog.find(c=>c.name===n)?.status,'preview');
});
test('factory owns standards, skill build copies them',()=>{
 assert.ok(fs.existsSync(path.join(root,'standards/design/rendering.md')));
 assert.match(fs.readFileSync(path.join(root,'scripts/build-skill.mjs'),'utf8'),/standards\/design/);
});
test('Lab registers the focus journey',()=>{
 assert.match(fs.readFileSync(path.join(root,'apps/lab/scenarios/index.tsx'),'utf8'),/focus: FocusJourneyScenario/);
});
