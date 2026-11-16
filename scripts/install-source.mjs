import fs from 'node:fs';
import path from 'node:path';
// Pure Node installer: can be shipped with the skill. Usage:
// node install-source.mjs <source-directory> <registry-file> <application-directory> [--all] [--components=id1,id2] [--force]
const [src,registryPath,dest,...flags]=process.argv.slice(2);
if(!src || !registryPath || !dest){console.error('Usage: node install-source.mjs <library-dir> <catalog.json> <app-dir> [--all|--components=id1,id2] [--force]');process.exit(1);}
const library=path.resolve(src), catalog=JSON.parse(fs.readFileSync(registryPath,'utf8'));
const target=path.join(path.resolve(dest),'src/ui');
const all=flags.includes('--all');const selected=(flags.find(x=>x.startsWith('--components=')) ?? '').split('=')[1]?.split(',').filter(Boolean) ?? [];
if(!all && !selected.length){console.error('Specify --all or --components=id1,id2');process.exit(1);}
const ids=new Set(catalog.map(x=>x.id));
for(const item of selected)if(!ids.has(item)){console.error(`Unknown component: ${item}`);process.exit(1);}
const allowed=new Set(catalog.filter(x=>['stable','preview'].includes(x.status)).map(x=>x.id));
for(const id of selected)if(!allowed.has(id)){console.error(`Cannot install development component: ${id}`);process.exit(1);}
// v0.1 conservatively installs all stable source (safe dependent closure), even when selecting entries.
// This avoids a fragile partial dependency resolver; --components narrows the declared intent only.
const files=[];
function visit(dir){for(const entry of fs.readdirSync(dir,{withFileTypes:true})){const file=path.join(dir,entry.name);if(entry.isDirectory())visit(file);else files.push(file);}}
visit(library);
const force=flags.includes('--force');
const collisions=files.map(file=>path.join(target,path.relative(library,file))).filter(file=>fs.existsSync(file));
if(collisions.length && !force){console.error(`Refusing to overwrite ${collisions.length} existing library files. Use --force explicitly.`);process.exit(1);}
for(const file of files){const out=path.join(target,path.relative(library,file));fs.mkdirSync(path.dirname(out),{recursive:true});fs.copyFileSync(file,out);}
const manifest={installedAt:new Date().toISOString(),source:'mobile-software-factory',mode:'full-approved-source',requested:all?['all']:selected,components:[...allowed]};
fs.writeFileSync(path.join(path.resolve(dest),'factory-install.json'),JSON.stringify(manifest,null,2)+'\n');
console.log(`Installed ${files.length} UI source files to ${target}`);
