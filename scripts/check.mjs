import {validate,root,loadCatalog} from './lib.mjs';
const issues=validate();
if(issues.length){console.error(issues.join('\n'));process.exit(1);}
console.log(`PASS: ${loadCatalog().length} catalog entries; exports, showcase registrations, tests and taxonomy boundaries checked.`);
