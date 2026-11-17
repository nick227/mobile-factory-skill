import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {root,copyDir} from './lib.mjs';
const version=JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8')).version;
const zip=path.join(root,`dist/mobile-development-skill-v${version}.zip`);
if(!fs.existsSync(zip)){console.error('Run pnpm skill:build first');process.exit(1);}
const temp=fs.mkdtempSync(path.join(os.tmpdir(),'factory-verify-'));
try{
 const python=['python3','python','py'].find(exe=>!spawnSync(exe,['--version'],{stdio:'ignore'}).error);
 if(!python)throw new Error('Python required for ZIP verification');
 const extract=spawnSync(python,['-m','zipfile','-e',zip,temp],{stdio:'inherit'});
 if(extract.status!==0)throw new Error('Failed to extract ZIP');
 const skill=path.join(temp,'mobile-development');
 if(!fs.existsSync(path.join(skill,'scripts/scaffold-workspace.mjs')))throw new Error('Missing packaged workspace scaffolder');
 if(!fs.existsSync(path.join(skill,'assembly/src/MonadPage.tsx')))throw new Error('Missing packaged Monad page runtime');
 const app=path.join(temp,'fresh-app');copyDir(path.join(skill,'templates/expo-app'),app);
 const install=spawnSync(process.execPath,[path.join(skill,'scripts/install-source.mjs'),path.join(skill,'library'),path.join(skill,'catalog.json'),app,'--all'],{stdio:'inherit'});
 if(install.status!==0)throw new Error('Package installer failed');
 if(!fs.existsSync(path.join(app,'src/ui/index.ts'))||!fs.existsSync(path.join(app,'factory-install.json')))throw new Error('Incomplete installed app');
 if(!fs.existsSync(path.join(skill,'references/design/rendering.md')))throw new Error('Missing bundled native experience standard');
 // Every path the packaged skill tells an agent to load or run must exist inside the package.
 const mds=[];const walk=d=>{for(const e of fs.readdirSync(d,{withFileTypes:true})){const p=path.join(d,e.name);if(e.isDirectory())walk(p);else if(e.name.endsWith('.md'))mds.push(p);}};
 walk(path.join(skill,'references'));mds.push(path.join(skill,'SKILL.md'));
 const broken=[];
 for(const file of mds){const text=fs.readFileSync(file,'utf8');for(const m of text.matchAll(/(?<![\w/@.-])`?((?:references|templates|recipes|scripts|foundations|library)\/[A-Za-z0-9_./-]*)`?/g)){const rel=m[1].replace(/[.,)]+$/,'');if(rel.includes('<'))continue;if(!fs.existsSync(path.join(skill,rel)))broken.push(`${path.relative(skill,file)} → ${rel}`);}}
 for(const f of ['catalog.json','contracts.json','scripts/factory.mjs','factory-v1/orchestrator.mjs'])if(!fs.existsSync(path.join(skill,f)))broken.push(`package → ${f}`);
 if(broken.length)throw new Error(`Broken skill paths:\n${broken.join('\n')}`);
 // The packaged CLI must evaluate workflow state on its own (catalog.json layout, no repo).
 const proj=path.join(temp,'probe');
 const run=(...a)=>spawnSync(process.execPath,[path.join(skill,'scripts/factory.mjs'),...a,'--project',proj],{encoding:'utf8'});
 if(run('project','init','--name','Probe','--mode','lite').status!==0)throw new Error('Packaged project init failed');
 const st=run('workflow','status');if(st.status!==0||JSON.parse(st.stdout).segment!=='02-discovery')throw new Error(`Packaged workflow status failed: ${st.stderr||st.stdout}`);
 console.log(`PASS: ${mds.length} skill documents, all referenced paths resolve; packaged workflow status works.`);
 console.log('PASS: packaged ZIP independently extracted, installed, and source/manifest verified.');
}finally{fs.rmSync(temp,{recursive:true,force:true});}
