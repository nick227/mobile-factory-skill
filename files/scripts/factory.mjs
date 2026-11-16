#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import * as e from '../factory-v1/engine.mjs';
const [family,verb,...rest]=process.argv.slice(2);
const flags=new Map();const args=[];
for(let i=0;i<rest.length;i++){if(rest[i].startsWith('--'))flags.set(rest[i].slice(2),rest[++i]);else args.push(rest[i]);}
const dir=flags.get('project')||process.cwd();
const output=data=>process.stdout.write(JSON.stringify(data,null,2)+'\n');
const help={
 usage:'node scripts/factory.mjs <family> <action> [options]',
 actions:['project init --project PATH --name NAME','project status --project PATH','project update --project PATH --file PATCH.json','discovery next --project PATH','catalog search --query TERM','catalog get ID','blueprint audit --project PATH','blueprint approve --project PATH','blueprint export --project PATH','plan build --project PATH','plan next --project PATH','plan list --project PATH','plan task ID --project PATH','plan done ID --project PATH --evidence TEXT']};
try{
 if(!family||family==='help')output(help);
 else if(family==='project'&&verb==='init')output(e.init(dir,flags.get('name')||path.basename(path.resolve(dir))));
 else if(family==='project'&&verb==='status'){const p=e.load(dir);output({name:p.name,phase:p.phase,revision:p.revision,approved:p.approval?.revision===p.revision,screenCount:p.screens.length,unanswered:e.questions(p).map(q=>q.id),nextTasks:e.next(p).map(t=>t.id)});}
 else if(family==='project'&&verb==='update'){const file=flags.get('file');if(!file)throw Error('Provide --file PATCH.json');output(e.update(dir,JSON.parse(fs.readFileSync(file,'utf8'))));}
 else if(family==='discovery'&&verb==='next')output(e.questions(e.load(dir)));
 else if(family==='catalog'&&verb==='search')output(e.catalog(flags.get('query')||args.join(' '),Number(flags.get('limit')||12)));
 else if(family==='catalog'&&verb==='get')output(e.catalogGet(args[0]));
 else if(family==='blueprint'&&verb==='audit')output(e.audit(e.load(dir)));
 else if(family==='blueprint'&&verb==='approve')output(e.approve(dir));
 else if(family==='blueprint'&&verb==='export')output(e.exportDocs(dir));
 else if(family==='plan'&&verb==='build')output(e.planBuild(dir));
 else if(family==='plan'&&verb==='next')output(e.next(e.load(dir)));
 else if(family==='plan'&&verb==='list')output(e.load(dir).tasks);
 else if(family==='plan'&&verb==='task')output(e.packageTask(e.load(dir),args[0]));
 else if(family==='plan'&&verb==='done')output(e.doneTask(dir,args[0],flags.get('evidence')));
 else throw Error('Unknown command; run: node scripts/factory.mjs help');
}catch(err){process.stderr.write(JSON.stringify({error:err.message})+'\n');process.exitCode=1;}
