import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
export const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const taxonomy = ['foundation', 'primitives', 'controls', 'composites', 'patterns'];
export const maturityTiers = ['candidate', 'implemented', 'verified', 'recommended'];
export const allowedStatuses = [...maturityTiers, 'stable', 'preview', 'development'];
export function normalizeMaturity(status) {
  if (status === 'candidate' || status === 'development') return 'candidate';
  if (status === 'implemented' || status === 'preview') return 'implemented';
  if (status === 'verified') return 'verified';
  if (status === 'recommended' || status === 'stable') return 'recommended';
  return 'candidate';
}
export function loadCatalog(base=root){return JSON.parse(fs.readFileSync(path.join(base,'packages/catalog/registry.json'),'utf8'));}
export function copyDir(source,target){fs.mkdirSync(target,{recursive:true});fs.cpSync(source,target,{recursive:true,force:true});}
export function walk(directory){if(!fs.existsSync(directory))return [];return fs.readdirSync(directory,{withFileTypes:true}).flatMap(entry=>{const p=path.join(directory,entry.name);return entry.isDirectory()?walk(p):[p];});}
export function validate(base=root){
 const items=loadCatalog(base);const issues=[];const ids=new Set();
 const sourceRoot=path.join(base,'packages/ui/src');
 for(const item of items){
   if(ids.has(item.id))issues.push(`Duplicate ID: ${item.id}`); ids.add(item.id);
   if(!taxonomy.includes(item.category) || item.category==='foundation')issues.push(`Unexpected category: ${item.id}`);
   if(item.id !== `${item.category}.${item.name.toLowerCase()}`)issues.push(`Invalid ID: ${item.id}`);
   if(!item.source.startsWith(item.category+'/'))issues.push(`Wrong folder: ${item.source}`);
   if(!allowedStatuses.includes(item.status))issues.push(`Invalid status: ${item.id}`);
   if(item.status==='candidate'||item.status==='development')continue;
   const file=path.join(sourceRoot,item.source);
   if(!fs.existsSync(file)){issues.push(`Missing source: ${item.source}`);continue;}
   const text=fs.readFileSync(file,'utf8');
   if(!new RegExp(String.raw`export\s+(?:function|const|class)\s+${item.exportName}\b`).test(text))issues.push(`Missing named export: ${item.id}`);
   const expected=`export * from './${item.category}/${item.name}';`;
   if(!fs.readFileSync(path.join(sourceRoot,'index.ts'),'utf8').includes(expected))issues.push(`Missing public export: ${item.id}`);
   if(!fs.existsSync(path.join(base,'apps/lab/showcases',`${item.name}.showcase.tsx`)))issues.push(`Missing showcase: ${item.id}`);
   if(!fs.existsSync(path.join(base,'packages/ui',item.test)))issues.push(`Missing test: ${item.id}`);
   const showcaseIndex=fs.readFileSync(path.join(base,'apps/lab/showcases/registry.tsx'),'utf8');
   if(!showcaseIndex.includes(`${item.showcase}:`))issues.push(`Missing live showcase registration: ${item.id}`);
 }
 for(const file of walk(sourceRoot).filter(x=>/\.tsx?$/.test(x))){
   const relative=path.relative(sourceRoot,file).replaceAll('\\','/');const [level]=relative.split('/');
   if(relative === 'index.ts')continue;
   if(!taxonomy.includes(level)) {issues.push(`Unknown taxonomy folder: ${relative}`);continue;}
   const content=fs.readFileSync(file,'utf8');
   const imports=[...content.matchAll(/(?:import|export)\s+(?:[^'";]*?\s+from\s+)?['"]([^'"]+)['"]/g)];
   for(const m of imports){
     if(!m[1].startsWith('.'))continue;
     const dest=path.resolve(path.dirname(file),m[1]);
     const rel=path.relative(sourceRoot,dest).replaceAll('\\','/');const destLevel=rel.split('/')[0];
     if(!taxonomy.includes(destLevel)){issues.push(`Internal import outside taxonomy: ${relative} -> ${m[1]}`);continue;}
     if(taxonomy.indexOf(destLevel)>taxonomy.indexOf(level))issues.push(`Upward dependency: ${relative} -> ${m[1]}`);
   }
 }
 // Validate production source has no duplicate module-level names in catalog
 return issues;
}

export function validateEjectedScreen(filePath, content) {
 const issues = [];
 if (!content.includes('useSafeAreaInsets') && !content.includes('SafeAreaView') && !content.includes('<Screen')) {
   issues.push(`${filePath}: missing safe-area inset protection (useSafeAreaInsets or Screen primitive)`);
 }
 if (!content.includes('ScreenHeader')) {
   issues.push(`${filePath}: missing standard ScreenHeader component`);
 }
 if (/from\s+['"][^'"]*packages\/ui\/src/.test(content)) {
   issues.push(`${filePath}: illegal deep import into packages/ui/src; use '@/src/ui'`);
 }
 if (/(?:color|backgroundColor|borderColor)\s*:\s*['"]#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})\b/i.test(content)) {
   issues.push(`${filePath}: hardcoded hex color detected; use theme tokens from useTheme()`);
 }
 return issues;
}
