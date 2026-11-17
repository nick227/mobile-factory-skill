// Gate evaluator: derives the active workflow segment and its unmet conditions from
// .factory/project.json. Nothing here is persisted: the segment is always recomputed from
// state, so a revised fact or screen reopens exactly the conditions it affects.
// The skill's SKILL.md routes on `segment.reference`; each reference documents its conditions.
import fs from 'node:fs';
import path from 'node:path';
import * as engine from './engine.mjs';
import * as plan from './planner.mjs';
import * as cat from './catalog-contract.mjs';

export const SEGMENTS = [
  { id: '02-discovery', title: 'Discovery', goal: 'Understand the product: purpose, audience, scope, accounts and data' },
  { id: '03-requirements', title: 'Requirements', goal: 'Every required fact captured, sourced, confirmed and free of conflicts' },
  { id: '04-design', title: 'Design', goal: 'Navigation, direction, screens, data model and roles specified' },
  { id: '05-blueprint', title: 'Blueprint', goal: 'Audit passes, the user confirms this revision, the blueprint is approved' },
  { id: '06-catalog', title: 'Catalog & plan', goal: 'Approved work is mapped to real parts and a current task plan' },
  { id: '07-construction', title: 'Construction', goal: 'Every build task is done with executed-check evidence' },
  { id: '08-verification', title: 'Verification', goal: 'Screens verified, gaps recorded, release authorised by the user' },
];
const PHASE_SEGMENT = { discover: '02-discovery', architecture: '03-requirements', release: '03-requirements', design: '04-design' };
const known = (p, key) => key in (p.facts ?? {}) && p.facts[key].status !== 'conflicted';
const BUILD_TYPES = new Set(['agent', 'agent-implement', 'agent-compose']);
const isBuildTask = (t) => BUILD_TYPES.has(t.type) || /^setup-/.test(t.id);
const isVerifyTask = (t) => /^verify-/.test(t.id);

function condition(id, met, message, fix, required = true) {
  return { id, met: Boolean(met), required, message, fix: met ? undefined : fix };
}

function evaluateConditions(dir, p) {
  const facts = p.facts ?? {};
  const out = Object.fromEntries(SEGMENTS.map((s) => [s.id, []]));
  const unanswered = engine.questions(p);
  const lite = p.profile?.mode === 'lite';

  // 02 Discovery: the product is understood well enough to extract requirements.
  const d = out['02-discovery'];
  for (const q of engine.workflow.filter((x) => x.phase === 'discover')) {
    // Discovery only needs the topic covered; a conflicted value is resolved in 03.
    d.push(condition(`fact:${q.id}`, q.id in facts, q.question, `Ask or infer, then: interview record --key ${q.id} --value <json> --quote "<user words>" (or --status inferred)`));
  }
  d.push(condition('fact:experience.primary', known(p, 'experience.primary'), 'Which experience matters most?', 'interview record --key experience.primary --value \'"browse-collection"\' (see catalog experiences)', false));
  if (!lite) d.push(condition('fact:product.excluded', known(p, 'product.excluded'), 'What is explicitly out of scope for v1?', 'interview record --key product.excluded --value \'["..."]\' --quote "<user words>"', false));

  // 03 Requirements: facts are complete, sourced, consistent and confirmed.
  const r = out['03-requirements'];
  const unmined = plan.unminedAnchors(dir);
  r.push(condition('sources:mined', !unmined.length, `${unmined.length} source anchor(s) not yet mined`, 'interview next → mine-source items; record facts with {anchor, quote} or {skip:[anchors]}'));
  r.push(condition('conflicts:none', !(p.conflicts ?? []).length, `Conflicts: ${(p.conflicts ?? []).map((c) => c.key).join(', ')}`, 'Ask the user to choose, then: interview confirm <key> --values \'{"<key>":<value>}\' --quote "<user words>"'));
  const pending = Object.entries(facts).filter(([, f]) => ['proposed', 'inferred'].includes(f.status)).map(([k]) => k);
  r.push(condition('facts:confirmed', !pending.length, `Unconfirmed assumptions: ${pending.join(', ')}`, 'Ask the user to confirm or correct them in one message, then: interview confirm all --quote "<user words>"'));
  for (const q of unanswered.filter((x) => (PHASE_SEGMENT[x.phase] === '03-requirements' || x.phase === 'discover') && !pending.includes(x.id))) {
    r.push(condition(`answer:${q.id}`, false, `${q.question} (needs a stated or confirmed answer)`, `interview record --key ${q.id} --value <json> --quote "<user words>"`));
  }

  // 04 Design: experience decisions and screen contracts.
  const g = out['04-design'];
  for (const q of engine.workflow.filter((x) => x.phase === 'design')) {
    g.push(condition(`answer:${q.id}`, !unanswered.some((u) => u.id === q.id), `${q.question} (stated or confirmed)`, `Propose options, then: interview record --key ${q.id} --value <json> --quote "<user words>"`));
  }
  const screens = p.screens ?? [];
  g.push(condition('screens:defined', screens.length > 0, 'At least one screen', 'blueprint set --file blueprint.json with screens[]'));
  let items = null;
  try { items = new Set(cat.load().items.map((i) => i.id)); } catch { /* catalog unavailable */ }
  const registry = new Set(JSON.parse(fs.readFileSync(engine.getRegistryPath(), 'utf8')).map((x) => x.id));
  for (const s of screens) {
    const issues = engine.screenIssues(s, registry);
    if (s.recipe && items && !items.has(s.recipe)) issues.push(`Unknown recipe ${s.recipe}`);
    for (const e of s.entities ?? []) if (!(p.entities ?? []).some((x) => x.id === e)) issues.push(`Unknown entity ${e}`);
    g.push(condition(`screen:${s.id}`, !issues.length, issues.length ? `${s.id}: ${issues.join('; ')}` : `${s.id} contract complete`, `blueprint set with the missing fields for ${s.id} (load 06-catalog for component ids)`));
  }
  if (screens.length) g.push(condition('screens:basis', screens.every((s) => (s.basis ?? []).length), `Screens without basis[]: ${screens.filter((s) => !(s.basis ?? []).length).map((s) => s.id).join(', ')}`, 'Add basis[] (fact keys each screen depends on) so later changes stale only that screen', false));
  if (p.answers?.['data.required'] === true) g.push(condition('entities:defined', (p.entities ?? []).some((e) => e && typeof e === 'object' && e.fields), 'Persistent data needs typed entities', 'blueprint set with entities[] {id, fields}'));
  if (p.answers?.['identity.required'] === true) g.push(condition('roles:defined', (p.roles ?? []).length > 0, 'Accounts need roles/permissions', 'blueprint set with roles[] {id, can[]}'));

  // 05 Blueprint: user confirmation for this revision, then approval.
  const b = out['05-blueprint'];
  const confirmations = (p.decisions ?? []).filter((x) => x?.type === 'user-confirmation');
  const current = confirmations.some((x) => x.revision === undefined || x.revision === p.revision);
  b.push(condition('user:confirmed', current, confirmations.length ? `User confirmation for revision ${p.revision}` : 'User has confirmed the blueprint', 'Show blueprint brief + wireframes; after explicit approval: blueprint set --file confirm.json {"decisions":[{"type":"user-confirmation","value":"USER: <their words>"}]}'));
  const approved = p.approval?.revision === p.revision;
  b.push(condition('blueprint:approved', approved, `Blueprint approved at revision ${p.revision}`, 'blueprint audit (must be ready), then: blueprint approve'));

  // 06 Catalog & plan: approved parts resolve and the task plan matches this approval.
  const c = out['06-catalog'];
  const tasks = p.tasks ?? [];
  const planned = approved && tasks.length > 0 && (p.plannedRevision === undefined ? !tasks.some((t) => t.status === 'stale') : p.plannedRevision === p.revision) && screens.every((s) => tasks.some((t) => t.id === `screen-${s.id}`));
  c.push(condition('plan:current', planned, 'Task plan built for the approved revision', 'plan build (keeps finished work; stale tasks return to todo)'));
  if (items) {
    const unresolved = screens.flatMap((s) => [...(s.components ?? []), ...(s.recipe ? [s.recipe] : [])]).filter((id) => !items.has(id));
    c.push(condition('parts:resolved', !unresolved.length, unresolved.length ? `Unknown parts: ${[...new Set(unresolved)].join(', ')}` : 'All screen parts exist in the catalog', 'catalog search "<need>" and replace the id in blueprint set'));
  }

  // 07 Construction: build tasks done (verification tasks are segment 08).
  const k = out['07-construction'];
  const stale = tasks.filter((t) => t.status === 'stale').map((t) => t.id);
  k.push(condition('tasks:no-stale', !stale.length, `Stale tasks: ${stale.join(', ')}`, 'Re-approve if needed, then plan build'));
  const openBuild = tasks.filter((t) => isBuildTask(t) && t.status !== 'done').map((t) => t.id);
  k.push(condition('tasks:built', tasks.length > 0 && !openBuild.length, openBuild.length ? `Open build tasks: ${openBuild.join(', ')}` : tasks.length ? 'Build tasks done' : 'No task plan yet', 'plan next → plan task <id> → implement → plan done <id> --evidence "<checks run>"'));

  // 08 Verification: screen verification, visible gaps, user-authorised release.
  const v = out['08-verification'];
  const openVerify = tasks.filter((t) => isVerifyTask(t) && t.status !== 'done').map((t) => t.id);
  v.push(condition('tasks:verified', tasks.length > 0 && !openVerify.length, openVerify.length ? `Open verification tasks: ${openVerify.join(', ')}` : tasks.length ? 'Verification tasks done' : 'No task plan yet', 'Run tsc / expo export / tests; plan done verify-<screen> --evidence "<checks run>"'));
  const gaps = tasks.filter((t) => t.gaps?.length).map((t) => t.id);
  v.push(condition('gaps:none', !gaps.length, `Recorded gaps: ${gaps.join(', ')}`, 'Close with device/browser evidence, or list them in the handoff as unverified', false));
  const release = tasks.find((t) => t.id === 'release-readiness');
  v.push(condition('release:authorised', release?.status === 'done', 'User authorised release readiness', 'Show the handoff; after explicit approval: plan done release-readiness --evidence "USER-APPROVED: <their words>"'));
  return out;
}

/** Every condition (met or not) per segment, for tests and tooling. */
export function conditions(dir) { return evaluateConditions(dir, engine.load(dir)); }

/** Current workflow state: every segment's conditions, the active segment and what to do next. */
export function status(dir) {
  const file = path.join(path.resolve(dir), '.factory', 'project.json');
  if (!fs.existsSync(file)) {
    return {
      project: null,
      segment: null,
      guidance: 'No factory project here. Fast path: small (≤ ~5 screens) app with an already-approved spec, built in one session → follow SKILL.md "Fast path". Otherwise start segment 02: project init --project <dir> --name <name> [--mode lite].',
      reference: 'references/02-discovery.md',
    };
  }
  const p = engine.load(dir);
  const conditions = evaluateConditions(dir, p);
  const segments = SEGMENTS.map((s) => {
    const list = conditions[s.id];
    const unmet = list.filter((c) => !c.met && c.required);
    return { id: s.id, title: s.title, complete: unmet.length === 0, unmet: unmet.map(({ id, message, fix }) => ({ id, message, fix })), advisory: list.filter((c) => !c.met && !c.required).map(({ id, message, fix }) => ({ id, message, fix })) };
  });
  const active = segments.find((s) => !s.complete) ?? null;
  const doneTasks = (p.tasks ?? []).filter((t) => t.status === 'done').length;
  const activeIndex = active ? SEGMENTS.findIndex((s) => s.id === active.id) : SEGMENTS.length;
  // Earlier segments reopen when a revision invalidates them after construction began.
  const reopened = Boolean(active) && activeIndex <= 4 && (p.tasks ?? []).length > 0;
  const next = active ? active.unmet[0] : null;
  return {
    project: p.name,
    mode: p.profile?.mode ?? 'standard',
    revision: p.revision,
    approved: p.approval?.revision === p.revision,
    segment: active ? active.id : 'complete',
    reference: active ? `references/${active.id}.md` : 'references/08-verification.md',
    reopened: reopened || undefined,
    preservedDoneTasks: reopened ? doneTasks : undefined,
    next: next ? { condition: next.id, message: next.message, fix: next.fix } : { message: 'All conditions met. Deliver the handoff (08-verification "Handoff").' },
    // Detail only up to the active segment; later gates are listed, not expanded (keeps the output small).
    segments: segments.map(({ id, complete, unmet, advisory }, i) => (i > activeIndex ? { id, complete } : { id, complete, unmet: unmet.length ? unmet : undefined, advisory: advisory.length ? advisory : undefined })),
  };
}

/** Compact Markdown block for BRIEF.md. */
export function summary(dir) {
  const s = status(dir);
  if (!s.project) return '';
  const lines = [`Active segment: **${s.segment}**${s.reopened ? ` (reopened; ${s.preservedDoneTasks} done task(s) preserved)` : ''} → load \`${s.reference}\`.`];
  if (s.next?.condition) lines.push(`Next condition: ${s.next.condition} — ${s.next.message}`);
  lines.push(`Segments: ${s.segments.map((x) => `${x.id.slice(0, 2)}${x.complete ? '✓' : '·'}`).join(' ')}`);
  return lines.join('\n');
}
