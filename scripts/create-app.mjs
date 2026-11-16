import fs from 'node:fs';
import path from 'node:path';
import { root,copyDir } from './lib.mjs';
import { spawnSync } from 'node:child_process';
const name=process.argv[2];
if(!name || !/^[a-z][a-z0-9-]*$/.test(name)){console.error('Usage: pnpm create:app <lowercase-kebab-name> [output-parent-directory]');process.exit(1);}
const dest=path.resolve(process.argv[3] ?? root,name);
if(fs.existsSync(dest)){console.error(`Destination already exists: ${dest}`);process.exit(1);}
copyDir(path.join(root,'templates/expo-app'),dest);
const packageFile=path.join(dest,'package.json');const pkg=JSON.parse(fs.readFileSync(packageFile));pkg.name=name;fs.writeFileSync(packageFile,JSON.stringify(pkg,null,2)+'\n');
const appFile=path.join(dest,'app.json');const app=JSON.parse(fs.readFileSync(appFile));app.expo.slug=name;app.expo.name=name;fs.writeFileSync(appFile,JSON.stringify(app,null,2)+'\n');
const result=spawnSync(process.execPath,[path.join(root,'scripts/install-source.mjs'),path.join(root,'packages/ui/src'),path.join(root,'packages/catalog/registry.json'),dest,'--all'],{stdio:'inherit'});
if(result.status!==0)process.exit(result.status ?? 1);
console.log(`Created ${dest}. Next: cd ${dest} && pnpm install && npx expo install --check`);
