#!/usr/bin/env node
/** Copy-safe Mobile Factory v1 foundation update. No dependency installation or destructive deletion. */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
const base=path.dirname(fileURLToPath(import.meta.url));
const opts=process.argv.slice(2);
const target=path.resolve(opts.find(a=>!a.startsWith('--'))||'.');
const dry=opts.includes('--dry-run');
const manifest=JSON.parse(fs.readFileSync(path.join(base,'manifest.json'),'utf8'));
const payload=path.join(base,'files');
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const read=p=>fs.readFileSync(p,'utf8');
const fail=(msg)=>{console.error(msg);process.exit(1);};
for(const f of ['package.json','packages/catalog/registry.json','skill/SKILL.md','scripts/build-skill.mjs'])if(!fs.existsSync(path.join(target,f)))fail(`Missing required factory file: ${f}`);
const current=JSON.parse(read(path.join(target,'package.json')));
if(!['0.6.0','1.0.0'].includes(current.version))fail(`Unknown factory version ${current.version}; expected 0.6.0 or already updated 1.0.0`);
const candidates=[];const conflicts=[];const noops=[];
for(const item of manifest.files){
 const destination=path.resolve(target,item.path);
 if(!destination.startsWith(target+path.sep))fail('Unsafe manifest path');
 const source=path.resolve(payload,item.path);if(!source.startsWith(payload+path.sep))fail('Unsafe payload path');
 const bytes=fs.readFileSync(source);if(sha(bytes)!==item.sha256)fail(`Bad update ZIP integrity: ${item.path}`);
 if(fs.existsSync(destination)){
  if(!fs.statSync(destination).isFile()){conflicts.push(`${item.path}: existing path is not a file`);continue;}
  if(sha(fs.readFileSync(destination))===item.sha256){noops.push(item.path);continue;}
  conflicts.push(`${item.path}: already exists with different content`);continue;
 }
 candidates.push({destination,source,path:item.path});
}
let modifiedPackage,modifiedSkill,modifiedBuilder;
try{
 const pkg=structuredClone(current);
 pkg.scripts={...pkg.scripts};
 if(pkg.scripts.factory&&pkg.scripts.factory!=='node scripts/factory.mjs')conflicts.push('package.json: existing factory script would be overwritten');
 if(pkg.scripts['test:factory-v1']&&pkg.scripts['test:factory-v1']!=='node --test tests/factory-v1.test.mjs')conflicts.push('package.json: existing test:factory-v1 script would be overwritten');
 pkg.scripts.factory='node scripts/factory.mjs';pkg.scripts['test:factory-v1']='node --test tests/factory-v1.test.mjs';pkg.version='1.0.0';
 if(!pkg.scripts.check.includes('node --test tests/*.test.mjs'))conflicts.push('package.json: check script has no test glob');
 modifiedPackage=JSON.stringify(pkg,null,2)+'\n';
 const skill=read(path.join(target,'skill/SKILL.md'));
 const stamp='<!-- factory-v1-blueprint-workflow -->';
 if(!skill.includes('name: mobile-development'))conflicts.push('skill/SKILL.md: unexpected skill structure');
 modifiedSkill=skill.includes(stamp)?skill:skill.trimEnd()+`\n\n${stamp}\n## Blueprint-first production (v1.0)\n\nFor new projects, **interview, compose, and gain explicit user approval before writing application code**. Use the factory's CLI for conditional questions, curated component catalog lookup, blueprint auditing, task planning, and fresh-agent task handoffs. Consult [the detailed workflow](references/production-workflow-v1.md). During construction compose JSX from curated factory components; do not assume automatic JSX or backend generation.\n`;
 const builder=read(path.join(target,'scripts/build-skill.mjs'));
 const insertAfter="fs.copyFileSync(path.join(root,'scripts/install-source.mjs'),path.join(skill,'scripts/install-source.mjs'));";
 const marker="// factory-v1: embedded project workflow API";
 if(!builder.includes(insertAfter) && !builder.includes(marker))conflicts.push('scripts/build-skill.mjs: unknown builder layout');
 modifiedBuilder=builder.includes(marker)?builder:builder.replace(insertAfter,insertAfter+`
${marker}
copyDir(path.join(root,'factory-v1'),path.join(skill,'factory-v1'));
fs.copyFileSync(path.join(root,'scripts/factory.mjs'),path.join(skill,'scripts/factory.mjs'));`);
}catch(err){conflicts.push(err.message);}
if(conflicts.length)fail(`STOP: ${conflicts.length} conflict(s); no files changed:\n - ${conflicts.join('\n - ')}`);
const edits=[{file:'package.json',before:read(path.join(target,'package.json')),after:modifiedPackage},{file:'skill/SKILL.md',before:read(path.join(target,'skill/SKILL.md')),after:modifiedSkill},{file:'scripts/build-skill.mjs',before:read(path.join(target,'scripts/build-skill.mjs')),after:modifiedBuilder}].filter(x=>x.before!==x.after);
console.log(`${dry?'DRY RUN':'READY'}: ${candidates.length} new files, ${edits.length} guarded edits, ${noops.length} already current; zero deletions.`);
if(dry)process.exit(0);
const backup=path.join(path.dirname(target),path.basename(target)+'-backup-before-v1-'+new Date().toISOString().replace(/[:.]/g,'-'));
const changed=[];
try{
 fs.mkdirSync(backup,{recursive:true});
 for(const item of edits){const file=path.join(target,item.file);const b=path.join(backup,item.file);fs.mkdirSync(path.dirname(b),{recursive:true});fs.copyFileSync(file,b);}
 for(const item of candidates){fs.mkdirSync(path.dirname(item.destination),{recursive:true});fs.copyFileSync(item.source,item.destination);changed.push(item.destination);}
 for(const item of edits){fs.writeFileSync(path.join(target,item.file),item.after);}
}catch(err){for(const item of changed.reverse())try{fs.rmSync(item)}catch{};for(const item of edits)try{fs.writeFileSync(path.join(target,item.file),item.before)}catch{};fail(`STOP: installation failed, rolled back: ${err.message}`);}
console.log(`Applied v1.0 blueprint foundation. Original edited files backed up to ${backup}`);
console.log('Next: pnpm check && pnpm factory help && pnpm skill:build && pnpm skill:verify');
