import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { InterviewAdapter } from '../bench/interview/adapter.mjs';
import { PERSONAS, ALL_PERSONAS } from '../bench/interview/personas.mjs';

async function main() {
  const personaId = process.argv[2] || 'vague-visionary';
  const persona = ALL_PERSONAS.find((p) => p.id === personaId) || PERSONAS[0];

  console.log(`\n======================================================`);
  console.log(`Running Single Live-Agent Interview`);
  console.log(`Persona: ${persona.title} (${persona.id})`);
  console.log(`Model: gemini-3.8-flash-low`);
  console.log(`======================================================\n`);

  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), `factory-live-${persona.id}-`));
  const adapter = new InterviewAdapter({ model: 'gemini-3.8-flash-low' });

  try {
    const result = await adapter.runLiveSession(persona, tempDir);
    console.log(`\nInterview Completed Successfully!`);
    console.log(`Turns conducted: ${result.transcript.length / 2}`);
    console.log(`\n=== Turn-by-Turn Audit ===\n`);

    for (const t of result.transcript) {
      if (t.role === 'user') {
        console.log(`\n[Turn ${t.turn}] 👤 Client: "${t.content}"`);
      } else {
        console.log(`\n[Turn ${t.turn}] 🤖 Live Agent Message:\n${t.content}`);
        if (t.envelope) {
          console.log(`Contract Type: ${t.envelope.type} | Status: ${t.envelope.status}`);
        }
        if (t.validationErrors?.length) {
          console.log(`⚠️ Validation Errors:\n  - ${t.validationErrors.join('\n  - ')}`);
        } else {
          console.log(`✅ Validated response envelope (Zero schema errors)`);
        }
      }
    }

    console.log(`\n=== Persisted Factory Decisions (.factory/project.json) ===`);
    console.log(JSON.stringify(result.projectState?.project?.classification || result.projectState?.batches?.selections?.classification || {}, null, 2));

    if (result.commandsExecuted?.length) {
      console.log(`\n=== Factory CLI Operations Executed ===`);
      for (const cmd of result.commandsExecuted) {
        console.log(`  > ${cmd}`);
      }
    }

    if (result.generated) {
      console.log(`\n=== Generated Application Verification ===`);
      console.log(`Status: ${result.generated.ok ? 'SUCCESS' : 'FAILED'} (mode: ${result.generated.mode})`);
      console.log(`AppSpec Hash: ${result.generated.appSpecHash}`);
      console.log(`Files Created:`);
      console.log(`  - app/index.tsx: ${result.generated.files.appIndexExists ? 'EXISTS' : 'MISSING'}`);
      console.log(`  - src/factory/app.ts: ${result.generated.files.appTsExists ? 'EXISTS' : 'MISSING'}`);
      console.log(`  - src/assembly/MonadPage.tsx: ${result.generated.files.monadPageExists ? 'EXISTS' : 'MISSING'}`);
      console.log(`Preserved Visual Tokens:`, result.generated.verifiedVisuals);
    }

    // Save single live interview record to bench/results/single-live-audit.json
    const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
    const outPath = path.join(rootDir, 'bench/results/single-live-audit.json');
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, JSON.stringify(result, null, 2) + '\n');
    console.log(`\nLive interview audit record saved to ${outPath}`);
  } catch (err) {
    console.error(`Live interview failed:`, err);
    process.exit(1);
  } finally {
    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
    } catch {}
  }
}

main();
