#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import * as e from '../factory-v1/engine.mjs';
import * as cat from '../factory-v1/catalog-contract.mjs';
import * as plan from '../factory-v1/planner.mjs';
import * as mods from '../factory-v1/modules.mjs';
import * as orch from '../factory-v1/orchestrator.mjs';
import * as asm from '../factory-v1/assembler.mjs';
import { scaffoldWorkspace } from './scaffold-workspace.mjs';
const [family,verb,...rest]=process.argv.slice(2);
const flags=new Map();const args=[];
for(let i=0;i<rest.length;i++){if(rest[i].startsWith('--'))flags.set(rest[i].slice(2),rest[++i]);else args.push(rest[i]);}
const dir=flags.get('project')||process.cwd();
const output=data=>process.stdout.write(JSON.stringify(data,null,2)+'\n');
const help={
 usage:'node scripts/factory.mjs <family> <action> [options]',
 actions:['app scaffold --project PATH','workflow status --project PATH','assemble check --spec APP.spec.json','assemble build --spec APP.spec.json --app APP_DIR [--dry-run true]','project init --project PATH --name NAME [--mode lite|standard]','source add --project PATH --file DOC.md [--title T]','interview next --project PATH','interview record --project PATH (--file FINDINGS.json | --key K --value JSON [--status stated|inferred|proposed] [--quote "user words"] [--anchor s1:p3])','interview confirm KEYS|all --project PATH --quote "user words" [--values JSON]','blueprint set --project PATH --file BLUEPRINT.json','blueprint brief --project PATH','module recommend --project PATH','module add ID[,ID] --app APP_DIR [--dry-run true]','wireframe SCREEN_ID|all --project PATH','project status --project PATH','project update --project PATH --file PATCH.json','discovery next --project PATH','catalog search NEED [--capability CAP] [--experience EXP] [--min-maturity LEVEL] [--kind component|recipe] [--limit N]','catalog get ID [--role interview|document|construct]','catalog experiences','catalog check','blueprint audit --project PATH','blueprint approve --project PATH','blueprint export --project PATH','plan build --project PATH','plan next --project PATH','plan list --project PATH','plan task ID --project PATH','plan done ID --project PATH --evidence TEXT']};
try{
 if(!family||['help','--help','-h'].includes(family))output(help);
 else if(family==='app'&&verb==='scaffold')output(scaffoldWorkspace(dir));
 else if(family==='project'&&verb==='init')output(plan.initProject(dir,flags.get('name')||path.basename(path.resolve(dir)),flags.get('mode')||'standard'));
 else if(family==='source'&&verb==='add')output(plan.addSource(dir,flags.get('file'),flags.get('title')));
 else if(family==='interview'&&verb==='next')output(plan.next(dir));
 else if(family==='interview'&&verb==='record'){const file=flags.get('file');const parse=v=>{try{return JSON.parse(v)}catch{return v}};output(plan.record(dir,file?JSON.parse(fs.readFileSync(file,'utf8')):{key:flags.get('key'),value:parse(flags.get('value')),status:flags.get('status'),source:flags.get('anchor')?{anchor:flags.get('anchor'),quote:flags.get('quote')}:flags.get('quote')?{id:'chat',quote:flags.get('quote')}:undefined,note:flags.get('note')}));}
 else if(family==='interview'&&verb==='confirm')output(plan.confirm(dir,args[0]==='all'?'all':String(args[0]||'').split(',').filter(Boolean),flags.get('quote'),flags.get('values')?JSON.parse(flags.get('values')):{}));
 else if(family==='blueprint'&&verb==='set'){const file=flags.get('file');if(!file)throw Error('Provide --file BLUEPRINT.json');output(plan.setBlueprint(dir,JSON.parse(fs.readFileSync(file,'utf8'))));}
 else if(family==='module'&&verb==='recommend'){if(!fs.existsSync(path.join(path.resolve(dir),'.factory','project.json')))output({note:'No blueprint here (fast path). Choose modules by these rules, then: module add <ids> --app <app>',modules:mods.loadModules().map(m=>({id:m.id,when:m.when.map(r=>r.always?'every app':r.screensUse?`screens use ${r.screensUse}`:`${r.fact} ${r.equals!==undefined?'= '+r.equals:r.present?'is set':'mentions '+r.matches}`).join(' or '),npm:m.npm}))});else output(mods.recommend(e.load(dir)));}
 else if(family==='module'&&verb==='add'){if(!flags.get('app'))throw Error('Provide --app APP_DIR');const r=mods.install(flags.get('app'),String(args[0]||'').split(',').filter(Boolean),{dryRun:flags.get('dry-run')==='true'});output(r);if(r.error)process.exitCode=1;}
 else if(family==='blueprint'&&verb==='brief')process.stdout.write(plan.brief(dir,{workflow:orch.summary(dir)}).markdown);
 else if(family==='workflow'&&verb==='status')output(orch.status(dir));
 else if(family==='assemble'&&verb==='check'){if(!flags.get('spec'))throw Error('Provide --spec APP.spec.json');const r=asm.validateSpec(JSON.parse(fs.readFileSync(flags.get('spec'),'utf8')));output(r);if(!r.ok)process.exitCode=1;}
 else if(family==='assemble'&&verb==='build'){if(!flags.get('spec')||!flags.get('app'))throw Error('Provide --spec APP.spec.json --app APP_DIR');const r=asm.assemble(flags.get('spec'),flags.get('app'),{dryRun:flags.get('dry-run')==='true'});output(r);if(!r.ok)process.exitCode=1;}
 else if(family==='wireframe'){const p=e.load(dir);const ids=verb==='all'?p.screens.map(s=>s.id):[verb];for(const id of ids){const s=p.screens.find(x=>x.id===id);if(!s)throw Error(`Unknown screen ${id}`);process.stdout.write(plan.wireframe(s)+'\n\n');}}
 else if(family==='project'&&verb==='status'){const p=e.load(dir);output({name:p.name,phase:p.phase,revision:p.revision,approved:p.approval?.revision===p.revision,screenCount:p.screens.length,unanswered:e.questions(p).map(q=>q.id),nextTasks:e.next(p).map(t=>t.id)});}
 else if(family==='project'&&verb==='update'){const file=flags.get('file');if(!file)throw Error('Provide --file PATCH.json');output(e.update(dir,JSON.parse(fs.readFileSync(file,'utf8'))));}
 else if(family==='discovery'&&verb==='next')output(e.questions(e.load(dir)));
 else if(family==='catalog'&&verb==='search')output(cat.find(cat.load(),{text:flags.get('query')||args.join(' '),capability:flags.get('capability'),experience:flags.get('experience'),minMaturity:flags.get('min-maturity'),kind:flags.get('kind'),limit:Number(flags.get('limit')||8)}));
 else if(family==='catalog'&&verb==='get')output(cat.view(cat.load(),args[0],flags.get('role')||'construct'));
 else if(family==='catalog'&&verb==='experiences')output(cat.experiences(cat.load()));
 else if(family==='catalog'&&verb==='check'){const c=cat.load();output({errors:c.problems,warnings:c.warnings,items:c.items.length});if(c.problems.length)process.exitCode=1;}
 else if(family==='blueprint'&&verb==='audit')output(e.audit(e.load(dir)));
 else if(family==='blueprint'&&verb==='approve')output(e.approve(dir));
 else if(family==='blueprint'&&verb==='export')output(e.exportDocs(dir));
 else if(family==='plan'&&verb==='build')output(plan.planBuild(dir));
 else if(family==='plan'&&verb==='next')output(e.next(e.load(dir)));
 else if(family==='plan'&&verb==='list')output(e.load(dir).tasks);
 else if(family==='plan'&&verb==='task')output(plan.taskPackage(dir,args[0]));
 else if(family==='plan'&&verb==='done')output(plan.done(dir,args[0],flags.get('evidence')));
 else throw Error('Unknown command; run: node scripts/factory.mjs help');
}catch(err){process.stderr.write(JSON.stringify({error:err.message})+'\n');process.exitCode=1;}
