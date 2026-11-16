import fs from 'node:fs';
import path from 'node:path';
import {root,taxonomy,loadCatalog} from './lib.mjs';
const [category,name]=process.argv.slice(2);
if(!category || !name || !taxonomy.includes(category) || category==='foundation' || !/^[A-Z][A-Za-z0-9]*$/.test(name)) {
 console.error('Usage: pnpm component:new <primitives|controls|composites|patterns> <PascalCaseName>');process.exit(1);
}
const base=path.join(root,'packages/ui/src',category);const dest=path.join(base,`${name}.tsx`);
const registry=loadCatalog();const id=`${category}.${name.toLowerCase()}`;
if(fs.existsSync(dest) || registry.some(x=>x.id===id))throw new Error(`Component already exists: ${id}`);
fs.mkdirSync(base,{recursive:true});
fs.writeFileSync(dest,`import React from 'react';\nimport { View } from 'react-native';\n// DEVELOPMENT: replace starter implementation before promotion.\nexport function ${name}() { return <View accessibilityLabel="${name}" />; }\n`);
const index=path.join(root,'packages/ui/src/index.ts');fs.appendFileSync(index,`export * from './${category}/${name}';\n`);
fs.writeFileSync(path.join(root,`packages/ui/tests/${name}.test.tsx`),`// TODO: add React Native Testing Library tests for ${name}.\nexport const componentUnderTest = '${name}';\n`);
fs.writeFileSync(path.join(root,`apps/lab/showcases/${name}.showcase.tsx`),`export const showcaseId = '${name}';\n`);
// Register a live showcase using the same canonical TSX.
const showcase=path.join(root,'apps/lab/showcases/registry.tsx');
let text=fs.readFileSync(showcase,'utf8');
text=`import { ${name} } from '@factory/ui';\n`+text;
const end=text.lastIndexOf('};');text=text.slice(0,end)+`  ${name}: () => <${name} />,\n`+text.slice(end);
fs.writeFileSync(showcase,text);
registry.push({id,name,category,status:'development',source:`${category}/${name}.tsx`,exportName:name,showcase:name,test:`tests/${name}.test.tsx`});
fs.writeFileSync(path.join(root,'packages/catalog/registry.json'),JSON.stringify(registry,null,2)+'\n');
console.log(`Created ${id}. Develop the component, showcase and tests before promotion.`);
