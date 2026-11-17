# Skill orchestration audit and redesign (2026-11-17)

Benchmark: `nick227/nick-webapp-factory-skill` (17 KB SKILL.md, 22 references, phase gates, a continuation
protocol). Subject: `skill/` in this repo (3.7 KB SKILL.md, 3 references) compared against the actual engine
(`factory-v1/*.mjs`, `scripts/factory.mjs`). Every finding below was checked against code or a CLI run.

## Findings

| # | Area | Finding | Evidence | Resolution |
|---|---|---|---|---|
| 1 | Depth | SKILL.md mostly listed commands. No segment had entry conditions, completion criteria, failure handling or examples. | `skill/SKILL.md` @465e9fb | SKILL.md is now an orchestrator. Seven segment references each carry a 10-part contract (enforced by a test). |
| 2 | Naming | `production-workflow-v1.md` mixed discovery, design, approval, construction and verification in 3.8 KB | file | Retired. The content now lives in `02-discovery.md` … `08-verification.md`. |
| 3 | Packaging | SKILL.md linked `references/foundations.md`, `catalog-contract.md` and `design/`. These exist only in the **built** package (copied by `build-skill.mjs`), so they look broken in the GitHub `skill/` folder, and nothing checked them. | `scripts/build-skill.mjs` | `tests/skill-docs.test.mjs` resolves every `references/` path in source or through the build map. `verify-skill.mjs` link-checks the extracted ZIP. |
| 4 | State discovery | There was no way to ask "where are we?". `project.phase` is coarse and wrong mid-flow: `invalidate()` sets `design` during discovery. | CLI run: phase after the first fact | New `workflow status`. It derives the active segment and unmet conditions from state and persists nothing new. |
| 5 | Gate safety | **An old user confirmation satisfied the approval gate after the blueprint changed.** An agent could re-approve a revision the user never saw. | `engine.audit` checked only that *some* confirmation existed; two tests relied on this | Confirmations are stamped with their revision. Audit and gate require one at the current revision. |
| 6 | Contradictions | **A stated `data.persistence` coexisted silently with a confirmed `data.required=false`.** The plan dropped `module-data`, while `module recommend` still added persistence. | CLI run, lite mode | An implication that contradicts a stated or confirmed fact now raises a conflict. Once the user resolves it, it isn't raised again. |
| 7 | Plan currency | Nothing showed whether the task plan matched the approved revision | `planBuild` | `plannedRevision` is recorded. Gate `plan:current`. |
| 8 | Scope | There was no fact for explicit non-goals | `questionBank` | `product.excluded` (advisory in standard mode) |
| 9 | Resume | The brief had no workflow position | `planner.brief` | BRIEF.md now starts with the active segment, the next condition and the segment checklist |
| 10 | Legacy | `project update` and `discovery next` bypass the facts ledger | `engine.update` | Documented as legacy, and not used by the skill |
| 11 | Recipe ids | `screen.recipe` was never validated | `engine.screenIssues` | Checked by the design gate (`screen:<id>`) and `parts:resolved` |

## Reference map

| File | Role |
|---|---|
| `SKILL.md` | Orchestrator: activate, orient (segment 01), segment loop, map, ask-vs-proceed, approval gates, changes, resume, fast path, rules, command index |
| `references/02-discovery.md` … `08-verification.md` | One operating contract per segment: entry, state to inspect, conditions (ids match the engine), reasoning procedure, user interaction, commands and schemas, examples, completion, failure handling, transitions and revisits |
| `references/factory-state.md` | Exact schemas: facts ledger, sources, blueprint, revisions and invalidation, tasks and evidence, fact keys, projections, engine errors |
| `references/architecture.md`, `quality.md` | Rewritten to match the foundations conventions and the evidence rules |
| `references/design/`, `native-quality.md`, `catalog-contract.md`, `foundations.md` | Generated at build time from `standards/` and `packages/` (unchanged ownership) |

`06-catalog.md` is both a segment (approved parts → plan) and a cross-cutting capability that doesn't move the
active segment.

## Design principles

- **Derived, not stored.** The active segment is recomputed from `.factory/project.json` on every call, so a
  revision reopens exactly the dependent conditions, and no "current segment" field can drift.
- **Minimal engine change.** The changes are one new module (`factory-v1/orchestrator.mjs`), three planner fixes
  (contradictions, confirmation stamping, `plannedRevision`) and one audit rule.
- **Docs can't drift from the engine.** Tests check that every condition id the engine evaluates appears in its
  segment reference, that every documented `factory.mjs` command exists, and that tagged JSON examples are
  accepted by the real API at their segment.

## Not done here

- No device or Expo verification was performed. All checks are Node and packaging only.
- The segmented natural-language UAT (`bench/segments/`) is reported separately in `docs/benchmarks/`.
