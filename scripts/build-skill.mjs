import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {root,validate,copyDir,loadCatalog} from './lib.mjs';
const errors=validate();if(errors.length)throw new Error(errors.join('\n'));
const dist=path.join(root,'dist'),skill=path.join(dist,'mobile-development');
fs.rmSync(skill,{recursive:true,force:true});fs.mkdirSync(skill,{recursive:true});
copyDir(path.join(root,'skill'),skill);
copyDir(path.join(root,'standards/design'),path.join(skill,'references/design'));
fs.copyFileSync(path.join(root,'standards/quality.md'),path.join(skill,'references/native-quality.md'));
copyDir(path.join(root,'packages/ui/src'),path.join(skill,'library'));
copyDir(path.join(root,'templates/expo-app'),path.join(skill,'templates/expo-app'));
fs.mkdirSync(path.join(skill,'scripts'),{recursive:true});
fs.copyFileSync(path.join(root,'scripts/install-source.mjs'),path.join(skill,'scripts/install-source.mjs'));
const version=JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8')).version;
const full=loadCatalog();
if(full.some(x=>x.status==='development')) throw new Error('Promote or remove development components before building skill');
const stable=full.filter(x=>['stable','preview'].includes(x.status));
fs.writeFileSync(path.join(skill,'catalog.json'),JSON.stringify(stable,null,2)+'\n');
fs.writeFileSync(path.join(skill,'RELEASE.json'),JSON.stringify({version,designStandard:'focus-first-native/0.6',components:stable.length,schemaVersion:1,source:'mobile-software-factory'},null,2)+'\n');
// Standard-library Python ZIP packaging, no JS ZIP dependency.
const zip=path.join(dist,`mobile-development-skill-v${version}.zip`);fs.rmSync(zip,{force:true});
const snippet='import os,sys,zipfile\nroot,out=sys.argv[1:]\nwith zipfile.ZipFile(out,"w",zipfile.ZIP_DEFLATED) as z:\n for d,_,names in os.walk(root):\n  for name in names:\n   p=os.path.join(d,name); z.write(p,os.path.relpath(p,os.path.dirname(root)))\n';
let result;
for(const python of ['python3','python','py']){
 result=spawnSync(python,['-c',snippet,skill,zip],{encoding:'utf8'});
 if(!result.error && result.status===0)break;
}
if(result.error || result.status!==0){console.error('Staged skill but ZIP creation failed; install Python 3.',result.stderr);process.exit(1);}
console.log(`Built ${zip} containing ${stable.length} cataloged components.`);
