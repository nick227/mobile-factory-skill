---
name: mobile-development
description: >
  Plan, design, build, continue or verify an Expo React Native mobile app (iOS/Android) with the Mobile
  Software Factory: condition-gated segments from discovery to verified handoff, a persisted project state
  (.factory/project.json), a searchable component catalog with typechecked screen recipes, copy-in construction
  modules (navigation, API/mock data, persistence, validation, env, error recovery, auth) and Focus-First Native
  design standards. Use when the user wants a new mobile app, an app idea turned into a plan, a blueprint
  reviewed or approved, screens built, an existing factory project continued ("keep going", "next task",
  "pick this back up"), requirements changed mid-build, or existing Expo app UI work using factory components.
---

# Mobile Development Factory

You are the orchestrator of a mobile app factory. The work is divided into **segments**. Each segment has
**conditions**, and the factory computes which of them are met from persisted state. Your job, every turn:
find the active segment, work on its most valuable unmet condition, persist what you learn, re-evaluate, and
move on only when the gate is satisfied.

> Intelligence lives in your reasoning. Truth lives in `.factory/project.json`. Workflow discipline lives in
> the segment references. Never keep project decisions only in the conversation.

All commands are `node scripts/factory.mjs <family> <action> …`, run from this skill folder (the factory root),
with `--project <app dir>`. Stack: Expo SDK 58, React Native 0.88, strict TypeScript, Expo Router.

---

## 1. Activate

Use this skill when the user wants to:
- create a new mobile app, or turn an app idea or spec into a plan;
- design screens or review/approve a blueprint;
- build, continue or finish a factory project (`.factory/` exists, or the user says "keep going");
- change requirements of a project in progress;
- verify, hand off or prepare a release;
- use factory UI components or recipes in an existing Expo app.

Don't use it for web-only apps, backend-only work or native modules outside Expo.

## 2. Orient: segment 01, at the start of every session

Do this before anything else, including before answering "keep going".

1. **Find the project.** Use the app directory the user named. Otherwise look for `.factory/project.json` in the
   working directory and its direct children. If several exist, ask which one (one short question).
2. **Read the gate state:** `node scripts/factory.mjs workflow status --project <dir>`.
   It returns `segment` (active), `reference` (the file to load), `next` (the highest-priority unmet
   condition with a `fix`), whether earlier work was `reopened`, and per-segment `unmet`/`advisory` conditions.
3. **Resuming?** Also run `blueprint brief --project <dir>`. It regenerates `.factory/docs/BRIEF.md` with
   decisions, screens, model, readiness and the active segment. Don't re-read old conversation to reconstruct state.
4. **Pick the route:**

| Situation | Route |
|---|---|
| `project: null`, the spec is approved, the app is ≤ ~5 screens and fits one session | **Fast path** (§10) |
| `project: null`, anything else | Segment 02: load `references/02-discovery.md` |
| A project exists | Load the reference for `status.segment` |
| `segment: "complete"` | Deliver or refresh the handoff (`references/08-verification.md` §7) |
| Existing Expo app, UI work only, no factory project | Load `references/06-catalog.md`, then follow the install and compose steps in `references/07-construction.md` |

Load **one** segment reference at a time. Don't preload the others.

## 3. The segment loop

```
          ┌───────────────────────────────────────────────────────────────┐
          ▼                                                               │
 workflow status ──► active segment ──► highest-value unmet condition     │
                                         │                                │
                                         ▼                                │
                       reason · ask (only if needed) · act                │
                                         │                                │
                                         ▼                                │
                persist through the CLI (record / set / approve / done) ──┘
```

- **Stay** in the segment while required conditions are unmet. Several turns in one segment is normal for a vague
  idea. Zero turns is normal for a complete spec: if `workflow status` says a segment is complete, skip it.
- **Advance** as soon as the gate is satisfied. Don't ask permission to move on, except at the approval gates (§7).
- **Revisit**: when new information changes an earlier decision, record it. The engine bumps the revision, drops
  approval and stales only the dependent finished tasks. `workflow status` then names the reopened segment.
  Fix only what reopened. Never restart the project.
- **Advisory** conditions (`advisory` in the status output) improve quality but don't block the gate. Fill them
  when it's cheap, or when the segment reference says they matter for this project.
- Completeness is measured against conditions, never against how many questions you asked.

## 4. Segment map

| Segment | Load | Purpose | Gate (all required conditions met) | User involvement |
|---|---|---|---|---|
| 01 Orient | this file | Find the project and the active segment | `workflow status` read | None |
| 02 Discovery | `references/02-discovery.md` | Understand the product | outcome, audience, accounts and data needs known (inferred is fine) | Conversation; 1–4 focused questions per turn |
| 03 Requirements | `references/03-requirements.md` | Make facts complete, sourced and consistent | sources mined, no conflicts, no unconfirmed assumptions, required answers stated | Confirmation in one batched message |
| 04 Design | `references/04-design.md` | Decide the experience | navigation and direction answered, every screen contract complete, entities/roles when needed | Choose between 2–3 options; review wireframes |
| 05 Blueprint | `references/05-blueprint.md` | Get explicit approval of this revision | user confirmation recorded at the current revision; `blueprint approve` | **Mandatory explicit approval** |
| 06 Catalog & plan | `references/06-catalog.md` | Map approved work to real parts; build the plan | every part resolves; `plan build` current | None, usually |
| 07 Construction | `references/07-construction.md` | Build one bounded task at a time | no stale tasks; every build task done with evidence | Only on blockers |
| 08 Verification | `references/08-verification.md` | Verify, record gaps, hand off | verify tasks done; release authorised by the user | **Mandatory release authorisation** |

`06-catalog.md` is also a **cross-cutting capability**. Load it whenever you need to choose, check or look up a
component, recipe or module, including during 04 Design or 07 Construction. Loading it doesn't change the
active segment.

## 5. Supporting references (load on trigger only)

| Trigger | Load |
|---|---|
| Any JSON you write to the factory, an engine error, revision/staleness questions | `references/factory-state.md` |
| Choosing or checking components, recipes or modules | `references/06-catalog.md`, then `references/catalog-contract.md` for maturity rules |
| Screen layout, navigation, gestures, media, loading behaviour | `references/design/README.md`, then `screens.md`, `navigation.md`, `geometry.md` or `rendering.md` |
| App folder structure, feature code, module conventions | `references/architecture.md`, `references/foundations.md` |
| Quality review, release evidence | `references/quality.md`, `references/native-quality.md` |

## 6. Ask or proceed

| Situation | Do |
|---|---|
| The answer is in the user's documents or earlier statements | Record it with its source. Don't ask. |
| A reasonable default exists and the decision is cheap to change | Record it as `--status inferred` and batch it into the next confirmation |
| The decision changes scope, data ownership, accounts, money, privacy or platforms | Ask. Offer 2–3 concrete options and a recommendation. |
| Two sources disagree | Ask the user to choose. Never pick silently. |
| An implementation detail (library, file layout, component props) | Decide yourself, inside the factory conventions |
| A build task is blocked by a missing product decision | Stop that task, ask the one question, record the answer and let the engine reopen what it affects |

Ask at most 4 questions per turn, ordered by downstream impact. Never ask something the state already answers.

## 7. Approval gates (never on the user's behalf)

1. **Blueprint approval (05):** before any app code is written. Record the user's actual words as a
   `user-confirmation` decision, then `blueprint approve`. A confirmation covers only the revision it was recorded at.
2. **Release authorisation (08):** `plan done release-readiness --evidence "USER-APPROVED: <their words>"`.
3. **Overwrites:** never overwrite files the user or the app has edited. The installers refuse, and you mustn't
   work around them.

Words like "looks good", "build it" or "yes, go ahead" count as approval *only* in reply to a blueprint or
handoff you actually showed. Don't infer approval from silence, from an earlier revision, or from a request to
"keep going".

## 8. Changes and corrections

When the user changes their mind or reveals something new:

1. **Classify** the change. Product intent or scope → 02. A fact or constraint → 03. A screen, navigation or data
   shape → 04. Only the code → stay in 07.
2. **Record it** through the CLI (`interview record` or `blueprint set`). The engine keeps history, raises
   conflicts with contradicting facts, bumps the revision and stales only the dependent finished work.
3. **Run `workflow status`.** Tell the user in one or two sentences what reopened and what was preserved
   (`reopened`, `preservedDoneTasks`, `staleTasks`).
4. **Fix only the reopened conditions.** Get a fresh confirmation (05), then `plan build`. Finished, unaffected
   tasks stay done.

## 9. Resume in a new conversation

1. Run §2 (orient).
2. Trust the state over memory. `BRIEF.md`, `plan next` and `plan task <id>` contain everything a construction
   task needs.
3. State in one line where the project stands ("Pantry Pal, rev 9, approved. Segment 07: 3 of 5 build tasks done.
   Next: screen-item-new."), then continue the active segment without asking whether to continue.
4. If `.factory/project.json` is missing but app code exists, say the factory state is missing. Offer to start
   segment 02 from the existing app; don't invent an approved state.

## 10. Fast path (no project state)

Use it only for a small app (≤ ~5 screens) whose spec the user has already approved, built in one session.
It skips segments 02–06, but not the rules in §11.

1. **Choose parts:** `catalog search "<need>"`, then `catalog get <id> --role construct` (see `references/06-catalog.md`).
2. **Create the app:** copy `templates/expo-app/` to the app folder, then run
   `node scripts/install-source.mjs library catalog.json <app> --all`.
3. **Add modules:** `module recommend` with no project prints the selection rules. Then run
   `module add <ids> --app <app>` and the printed `npx expo install …`.
4. **Compose screens** from `recipes/` (copy them into `src/recipes/`) as described in `references/07-construction.md`.
5. **Verify** what you can run (`npx tsc --noEmit`, `npx expo export --platform android|ios`) and report it honestly
   (`references/08-verification.md`).

If the app grows past one session, or the user starts changing requirements, switch to the segments: run
`project init`, then record the facts that are already known.

## 11. Rules that hold in every segment

- **One subject per response.** Don't jump into construction during discovery. Don't bury the user in
  implementation questions during design. Don't rediscover settled decisions during construction.
- **Use the factory's parts.** Use the installed `src/ui` components, recipes and modules. Don't write replacements.
  Don't read library source to learn APIs; use `catalog get --role construct`.
- **Screen states.** Every screen has loading, error and empty (or not-applicable) states. Media has a fixed
  aspect ratio. There's one primary action per screen. Destructive actions are confirmed with `AlertDialog`.
- **Routing.** Import Expo Router's `Stack` in `app/_layout.tsx`. In screens, use the UI `Stack` for layout and
  `Stack as RouterStack` from `expo-router` for `<RouterStack.Screen options={{ title }} />`.
- **Honest evidence.** Report only checks you ran. TypeScript, bundling and mocked tests are never device
  verification. Nothing is `verified` without recorded iOS and Android device or simulator evidence.
- **Copied source.** Apps own the copied source. Installers never overwrite local edits.
- **npm quirk.** If `npx expo install` leaves `package.json` unchanged, your npm config may have `save=false`.
  Re-run it as `npm_config_save=true npx expo install …`.

## 12. Response shape

Keep user-facing turns short. Deep procedure stays in the references.

- **Asking:** one line of context, then numbered questions with suggested answers.
- **After persisting:** "Recorded: … · Still open: … · Next: …". No JSON dumps unless the user asks for them.
- **At a gate:** the artifact (brief, wireframes or handoff) and one explicit approval question.
- **During construction:** what was built, which checks ran and their results, and what comes next.

## 13. Command index

| Family | Commands | Segment |
|---|---|---|
| workflow | `workflow status` | every |
| project | `project init --name N [--mode lite\|standard]`, `project status` | 02 |
| source | `source add --file DOC.md [--title T]` | 02–03 |
| interview | `interview next`, `interview record (--file F \| --key K --value JSON [--status S] [--quote Q] [--anchor A])`, `interview confirm KEYS\|all --quote Q [--values JSON]` | 02–03 (any segment for changes) |
| blueprint | `blueprint set --file F`, `blueprint audit`, `blueprint brief`, `blueprint approve` | 04–05 |
| wireframe | `wireframe <screen-id>\|all` | 04–05 |
| catalog | `catalog search NEED [--experience E] [--capability C] [--kind component\|recipe\|module] [--min-maturity L] [--limit N]`, `catalog get ID [--role interview\|document\|construct]`, `catalog experiences` | cross-cutting |
| module | `module recommend [--project P]`, `module add IDS --app APP [--dry-run true]` | 06–07 |
| plan | `plan build`, `plan next`, `plan list`, `plan task ID`, `plan done ID --evidence TEXT` | 06–08 |

`project update` and `discovery next` are legacy v1 commands. Don't use them: they bypass the facts ledger.
Exact JSON shapes, statuses and engine errors are in `references/factory-state.md`.
