# Agent lifecycle: failure points and fixes (2026-11-16)

Discovery → Profile → Blueprint → Component selection → Task planning → Construction → Verification.

Each row starts from a failure that was **observed**: in the v1.0 audit, or in a benchmark agent's friction log (`bench/results/*-REPORT.md`). Nothing was added that didn't trace back to one.

| Stage | Observed failure | Change | Branch |
|---|---|---|---|
| Discovery | Answers had no provenance. Documents couldn't be ingested. Agents hand-wrote strict JSON patches, and the shipped example patch broke. | Facts ledger (stated/inferred/proposed/confirmed/conflicted + sources + history). `source add` archives documents and splits them into citable anchors with verified quotes. `interview record` takes one fact at a time or in atomic batches. | planning |
| Discovery | Users were asked questions their own documents already answered. Revised documents would have to be re-read in full. | `interview next` mines documents before asking anything and never re-asks a known key. Revised sources carry over mined paragraphs, so only changed text is mined. | planning |
| Profile | Every app went through the full question set. | Lite mode: proposed defaults confirmed in one user message. Stated facts imply related defaults (persistence ⇒ `data.required`). | planning |
| Blueprint | Any edit invalidated approval **and wiped the task list** (the v1.0 run left the blueprint drifting from the code to avoid this). | Merge-by-id `blueprint set`. Revisions mark only dependent *finished* tasks stale. `plan build` keeps finished work. | planning |
| Blueprint | No data model and no layout artifact. | Typed entity fields → `model.ts`. Deterministic 36-column terminal wireframes. | planning |
| Selection | Catalog search matched names only, so the v1.0 agent read **every component file**. The import path was wrong. | Agent contract: summaries, capabilities, props, constraints, recipes, derived dependencies, role views. IDF-ranked need search. `@/src/ui` alias. | catalog |
| Selection | Maturity labels were hand-asserted, and 18 components claimed `verified` without evidence. | Effective maturity = min(claim, evidence). Unsupported claims are flagged in every construct view. | catalog |
| Selection | The built skill silently omitted 18 components. | All implemented components ship, with a regression test. | foundations |
| Planning | Task packages contained raw catalog records. | `plan task` returns compact construct views, recipe code, wireframe, relevant decisions, model and modules. | planning |
| Construction | Each arm hand-built a mock API, persistence, validation and error boundaries. | Construction modules, recommended from blueprint facts. The installer never overwrites app edits. | foundations |
| Construction | The planning ceremony costs tokens even when the spec is already approved. | **Fast path** in `SKILL.md` for small, pre-approved apps (measured in `docs/benchmarks/`). | foundations |
| Verification | `plan done` accepted any text. "Visual review" got marked done from `tsc` output. | Evidence must name executed checks. Device claims need a platform and OS version. Visual-review gaps stay visible in the brief. | planning, foundations |

## Fresh-agent contract

A new agent needs only three things:
- `.factory/docs/BRIEF.md`: under 1,500 tokens, tested; it states approval status, decisions with sources, screens, model and unverified tasks.
- `plan next`
- `plan task <id>`

Canonical state is `.factory/project.json`. The documents are projections and are regenerated deterministically.

## Ownership boundary (catalog)

- **`packages/catalog/registry.json`:** registration and installation facts. Owned by the UI foundation (Antigravity).
- **`packages/catalog/contracts.json` and `packages/catalog/recipes/`:** agent-facing semantics. Owned by agent intelligence (Claude).
- `CONTRACT.md` defines both. No field may live in both files, and a test enforces that.
