# Blueprint-first workflow

The factory owns source, catalog, workflow state and checks. You own conversation, design judgement and JSX composition. The user owns approval. All commands run as `node scripts/factory.mjs …` from the factory root or the unpacked skill, with `--project <app dir>`.

## 1. Discover (as short as the app allows)
- **One-sentence idea:** `project init --name N --mode lite`. Lite mode proposes defaults (no accounts, no persistence, single stack, factory design) and the user confirms them in one message.
- **Bigger apps:** `--mode standard`.
- **Documents:** `source add --file spec.md`. Each paragraph becomes a citable anchor (`s1:p4`). Mine the anchors before asking the user anything.
- **Loop on `interview next`.** It returns only open work, highest value first:
  1. `resolve-conflict`
  2. `confirm-assumptions`
  3. `mine-source` (batches of anchors)
  4. `ask` (questions not yet answered)
  5. `catalog-suggestions`
- **Record findings** with `interview record --file findings.json`: `[{key, value, source:{anchor, quote}}]`, or `{skip:[anchors]}` for anchors with no requirement. For quick answers use `--key K --value JSON --quote "user's words"`. Use `status: inferred|proposed` when the user didn't say it.
  - Quotes are checked against the archived text, so copy them exactly.
  - A batch is all-or-nothing.
- **Confirm with the user's words:** `interview confirm all|k1,k2 --quote "…"`. To resolve a conflict, add `--values '{"k":v}'`.
- **Changing an answer later** keeps the old one in its history. It invalidates approval and marks only the dependent *finished* tasks as stale.

## 2. Design the blueprint
- **Find parts:** `catalog search "<need>"`, `catalog experiences`, `catalog get <id> --role document`. Prefer `recipe.*` compositions.
- **Write the blueprint** with `blueprint set --file blueprint.json`. It merges by id:
  - `screens[]`: `{id, title, purpose, route, components[], recipe?, states[] (incl. loading, error), actions[], acceptance[], sources[] (anchors), basis[] (fact keys it depends on), entities[], layout?}`
  - `entities[]`: `{id, fields:{name:"string(3..80)|text?|int|bool|date|datetime|url|email|id|enum(a|b)|ref(entity)|type[]"}}`
- **Discuss layout:** `wireframe all` renders terminal wireframes.
- **Review the plan with the user:** `blueprint audit`, then `blueprint brief` (writes `.factory/docs/BRIEF.md`, `SCREENS.md`, `DECISIONS.md`, `model.ts`).

## 3. Approve (never on the user's behalf)
After the user explicitly approves, add `{"decisions":[{"type":"user-confirmation","value":"USER: <their words>"}]}` with `blueprint set`, then run `blueprint approve`. No application code is written before this.

## 4. Build one task at a time
- `plan build` creates tasks. Re-running it after re-approval keeps finished work.
- `plan next` lists ready tasks. `plan task <id>` returns everything the task needs:
  - import lines, props and constraints
  - the recipe code
  - the screen wireframe
  - the relevant decisions and TypeScript model

  Don't re-read the conversation or the whole catalog.
- Use `catalog get <id> --role construct` only for parts not in the package.
- `plan done <id> --evidence "<checks you ran and results>"` rejects evidence that names no executed check, and rejects device claims without a platform and OS version.

## Quality gate
Catalog maturity is computed from evidence:
- **`tested`:** automated (including mocked) tests.
- **`verified`:** recorded iOS **and** Android device or simulator evidence.

TypeScript passing, a bundle building or mocked tests passing never make anything verified. Report only what you actually ran.

## Fresh agent resume
Read `.factory/docs/BRIEF.md` (or run `blueprint brief`), then `plan next` and `plan task <id>`. Canonical state is `.factory/project.json`; everything in `docs/` is a projection.
