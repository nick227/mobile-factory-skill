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
 const app=path.join(temp,'fresh-app');copyDir(path.join(skill,'templates/expo-app'),app);
 const install=spawnSync(process.execPath,[path.join(skill,'scripts/install-source.mjs'),path.join(skill,'library'),path.join(skill,'catalog.json'),app,'--all'],{stdio:'inherit'});
 if(install.status!==0)throw new Error('Package installer failed');
 if(!fs.existsSync(path.join(app,'src/ui/index.ts'))||!fs.existsSync(path.join(app,'factory-install.json')))throw new Error('Incomplete installed app');
 if(!fs.existsSync(path.join(skill,'references/design/rendering.md')))throw new Error('Missing bundled native experience standard');
 console.log('PASS: packaged ZIP independently extracted, installed, and source/manifest verified.');
}finally{fs.rmSync(temp,{recursive:true,force:true});}
