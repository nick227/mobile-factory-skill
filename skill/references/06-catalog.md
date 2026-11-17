# Segment 06 — Catalog & construction plan

Two roles in one reference:

1. **As a segment** (after approval): confirm that every approved screen maps to real, usable parts, then build
   the task plan for the approved revision.
2. **As a cross-cutting capability** (any segment): find, compare and look up components, recipes and modules.
   Loading this file for a lookup during 04 or 07 **doesn't** change the active segment.

## 1. Purpose and entry conditions

- **Segment entry:** `workflow status` reports `segment: "06-catalog"`. The blueprint is approved, but the task
  plan is missing or was built for an older revision.
- **Capability entry:** you need a part for a screen (04), an import line or props while building (07), the
  modules an app needs, or the user asks "what can the factory do?" (02).

## 2. Inspect state first

- **Segment:** `workflow status` → `06-catalog` unmet (`plan:current`, `parts:resolved`). Then run
  `blueprint audit`, which should be ready.
- **Capability:** know the need in plain words ("list with pull to refresh", "confirm delete", "save on device").
  Check whether the screen already names a recipe; recipes bundle several parts correctly.

## 3. Required facts and decisions

| Condition id | Met when |
|---|---|
| `plan:current` | `plan build` ran for the approved revision (`plannedRevision === revision`), and every screen has a `screen-<id>` task |
| `parts:resolved` | Every screen component and recipe id exists in the catalog |

**Maturity** (computed from evidence, never asserted; `references/catalog-contract.md`):
`candidate` (not implemented: an `implement-*` task is created, never import it) < `implemented` < `tested`
(automated or mocked tests) < `verified` (iOS **and** Android evidence) < `recommended`. Most parts today are
`implemented`. Using them is fine, but every construct view warns that device evidence is missing. Say so, and
don't claim more.

## 4. Agent behaviour (reasoning procedure)

**Finding parts:**
1. Prefer a **recipe** when one matches the screen's content family. It encodes states, keys, refresh and layout
   rules that are easy to get wrong.
2. Otherwise run `catalog search "<need in plain words>"`. The search is IDF-ranked over names, capabilities,
   experiences and summaries, and understands synonyms (login → auth, photo → image, delete → destructive).
   Filter by `--experience`, `--capability`, `--kind` or `--min-maturity` when results are broad.
3. Use the right **role view**: `--role interview` to talk to the user about what's possible, `--role document`
   to write the blueprint (props, constraints, platforms), and `--role construct` to build (import line, props,
   constraints, recipe code, warnings).
4. **Never** read library source to learn an API, and never invent ids or props. If the catalog lacks something,
   say so and propose the closest composition, or a `candidate` part that becomes an implementation task.

**As a segment:**
1. Confirm `parts:resolved`. If an id is unknown, it's a design defect: fix it in 04 (that drops approval, so tell the user).
2. Review **candidates**: each becomes `implement-<id>` work in `packages/ui`. Make sure the user accepted that in 05.
3. Run `module recommend --project <dir>` and note the modules and why each was picked. `setup-*` and `module-*`
   tasks install them.
4. Run `plan build`. Check the result: `count`, `keptDone` (finished work preserved), `redoStale` (work to redo)
   and `next`.

## 5. User interaction

Usually none. Tell the user in one line: "Plan: 8 tasks, 0 new components, modules: navigation, error recovery,
storage, validation. Starting setup." Ask only if a candidate component or a missing capability changes scope.

## 6. Commands and schemas

```bash
node scripts/factory.mjs catalog search "searchable list" [--experience browse-collection] [--capability list.row] [--kind component|recipe|module] [--min-maturity tested] [--limit 8]
node scripts/factory.mjs catalog get recipe.collection-screen --role construct     # full recipe code + constraints
node scripts/factory.mjs catalog get controls.button --role document               # props, constraints, platforms
node scripts/factory.mjs catalog experiences                                       # experience → parts that deliver it
node scripts/factory.mjs module recommend --project <dir>
node scripts/factory.mjs plan build --project <dir>
node scripts/factory.mjs workflow status --project <dir>
```

Search results are `[{id, kind, summary, maturity}]`. A construct view looks like this:

```json
{ "id": "controls.button", "kind": "component", "summary": "Labelled button with primary, secondary, outline and ghost variants and a loading state.",
  "maturity": "implemented — automated (mocked) tests only", "props": "…", "constraints": ["…"],
  "import": "import { Button } from '@/src/ui';", "warnings": ["No native device evidence: verify on iOS and Android before claiming quality."] }
```

**Recipes:** `recipe.collection-screen`, `recipe.detail-screen`, `recipe.form-screen`, `recipe.settings-screen`
and `recipe.onboarding-pager`. **Modules:** `module.navigation` and `module.error-boundary` (every app),
`module.api-client` (`data.source` mentions an API, server or mock), `module.persistence` (`data.persistence`
is set, or accounts are required), `module.validation` (text fields or form recipe), `module.env` (a real remote
server) and `module.auth` (`identity.required`). Details are in `references/foundations.md`.

## 7. Outputs and examples

`plan build` returns:

```json
{ "count": 8, "keptDone": 0, "redoStale": 0, "next": ["setup-project"] }
```

On re-planning after the user moved storage to a server mid-build: `{ "count": 8, "keptDone": 2, "redoStale": 3, "next": ["module-data"] }`.
Report it as "2 finished tasks kept (setup), 3 to redo (data module and both screens that depend on it)".

## 8. Completion criteria

`06-catalog` shows `complete: true`. Each screen task's package (`plan task screen-<id>`) resolves components
without errors.

## 9. Failure and contradiction handling

| Situation | Handling |
|---|---|
| `Unknown catalog id` | Search again with plain words, or with `catalog experiences`. Fix the blueprint in 04 (needs re-approval). |
| A search returns nothing relevant | Broaden the words or remove filters. If it's still missing, it's a real gap: propose a composition of existing primitives, or record the gap. Don't fake a component. |
| The construct view shows `claimUnsupported` | Treat the part at its effective maturity and pass the warning on |
| `Blueprint must be approved before planning construction` | Go back to 05 |
| The plan has `implement-*` tasks the user didn't expect | Pause, explain the extra work, and offer an alternative part. If the user changes the screen, that's 04, then 05. |

## 10. Transitions and revisit rules

- **Advance to 07** after `plan build`, in the same turn.
- **Revisit 06** automatically after every re-approval: `plan:current` becomes unmet until `plan build` runs again.
- **Capability use** never changes the segment. After a lookup, return to the active segment's reference.
