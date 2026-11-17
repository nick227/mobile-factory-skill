# Factory state: schemas, lifecycle and errors

The canonical, exact reference for everything the factory persists. Load it when you write JSON for the factory,
hit an engine error, or need to predict what a change will reopen. Segment references link here instead of
repeating these details.

Canonical state: `<app>/.factory/project.json`. Everything in `.factory/docs/` is a regenerated projection.
Never edit either file by hand; write only through the CLI.

## 1. Project file (top level)

| Field | Meaning |
|---|---|
| `name`, `schemaVersion`, `createdAt` | Identity |
| `profile.mode` | `lite` (proposed defaults, short interview) or `standard` |
| `revision` | Increments on every change to projected facts or the blueprint |
| `approval` | `{revision, blueprintHash, at}` or `null`. Approved means `approval.revision === revision`. |
| `facts` | The facts ledger (§2). The source of truth for decisions. |
| `answers` | Projection of `stated` and `confirmed` facts. Audit and approval read it. |
| `sources`, `skipped`, `carried` | Archived documents (§3), anchors marked as containing no requirement, anchors carried over from earlier sources |
| `conflicts` | `[{key, options:[{value, sources}]}]`. They must be resolved before approval. |
| `screens`, `entities`, `roles`, `integrations`, `decisions` | The blueprint (§4) |
| `tasks`, `plannedRevision` | The construction plan (§6) and the revision it was built for |
| `phase` | Legacy, coarse label. **Don't route on it**; use `workflow status`. |

## 2. Facts ledger

```json
"data.persistence": {
  "value": "device storage (offline)",
  "status": "stated",
  "sources": [{ "anchor": "s1:p7", "quote": "data stays on the phone" }],
  "history": [{ "value": "SQLite", "status": "stated", "sources": [], "replacedAtRevision": 6 }]
}
```

**Statuses**

| Status | Meaning | Projected to `answers`? |
|---|---|---|
| `stated` | The user or a document said it. Needs a quote. | yes |
| `confirmed` | The user explicitly confirmed it (`interview confirm`) | yes |
| `inferred` | Your reasonable inference. Needs confirmation. | no |
| `proposed` | A factory or agent default (lite mode). Needs confirmation. | no |
| `conflicted` | Two sources, or a clear consequence, disagree. Resolve with `interview confirm --values`. | no |

**Sources:** `{anchor:"s1:p3", quote}` for a document, `{id:"chat", quote}` for the user's words, or
`{id:"factory", note}` for engine implications. Quotes are verified against the archived text, ignoring case,
whitespace and Markdown emphasis. Copy them exactly. A `stated` or `confirmed` fact without a quote is rejected.

**Recording findings** (`interview record --file findings.json`). The batch is all-or-nothing:

```json
[
  { "key": "product.audience", "value": "Busy home cooks who shop weekly", "source": { "anchor": "s1:p2", "quote": "busy home cooks who shop once a week" } },
  { "key": "data.offline", "value": true, "status": "inferred", "note": "spec says works offline" },
  { "skip": ["s1:p5"] }
]
```

Use the single form for one quick answer:
`interview record --key data.required --value true --quote "it has to remember our items"`.
`--value` is parsed as JSON when it can be, and kept as a string otherwise.

**Strengthening.** Recording the same value again upgrades `inferred`/`proposed` → `stated`, and anything →
`confirmed`. A different value replaces the fact and keeps the old one in `history`.

**Implications.** These are clear consequences, applied automatically:

| When this is stated or confirmed | Implies |
|---|---|
| `data.persistence`, `data.source` or `data.offline` with a value (not "none"/"no") | `data.required = true` |
| `identity.method` or `identity.recovery` with a value | `identity.required = true` |

If the implied key is still `proposed` or `inferred`, it's updated (inferred). If it's already `stated` or
`confirmed` with the opposite value, the engine raises a **conflict** (`record` returns it in `conflicts`). Once
the user resolves that conflict, it isn't raised again.

**Confirming:** `interview confirm all --quote "<user words>"` confirms every `proposed`/`inferred` fact.
`interview confirm data.required --values '{"data.required":true}' --quote "…"` resolves a conflict or corrects
a value while confirming it.

## 3. Sources and anchors

`source add --file spec.md [--title T]` archives the document under `.factory/sources/` and splits it into
anchors: one per paragraph, and one per list item when a block is a list. Each anchor gets a heading breadcrumb
(`"Pantry Pal › Scope"`). Re-adding identical text is a no-op. A revised document carries over the paragraphs
that were already mined, so only changed text needs mining. Every anchor must be cited by a fact, a screen
(`screens[].sources`), a conflict, or `skip` before requirements complete.

## 4. Blueprint (`blueprint set --file blueprint.json`)

The file accepts the keys `screens`, `entities`, `roles`, `integrations`, `decisions` and `remove`. Facts never go
here. Items merge **by id**: send only what changes. `remove: {"screens": ["id"]}` deletes items and their tasks.

**Screen**

| Field | Required | Notes |
|---|---|---|
| `id` | yes | lowercase, hyphenated; becomes `screen-<id>` and `verify-<id>` tasks |
| `title`, `purpose`, `route` | yes | `route` is an Expo Router path, e.g. `/`, `/items/[id]`, `/items/new` |
| `components` | yes, ≥ 1 | real catalog component ids. A `recipe.*` placed here is moved into `recipe`. |
| `recipe` | no | a `recipe.*` id. It's checked against the catalog by `workflow status`. |
| `states` | yes | must include `loading` and `error`. Add `empty`, `saving`, `ready` as relevant. |
| `actions` | yes (may be `[]`) | verbs, e.g. `["open-item","add-item"]` |
| `acceptance` | yes, ≥ 1 | testable statements; they become the task's acceptance |
| `basis` | advisory | the fact keys this screen depends on. A change to them stales only this screen. |
| `entities` | no | entity ids the screen reads or writes. They must exist. |
| `sources` | no | document anchors this screen implements (counts as mined) |
| `layout` | no | ordered wireframe blocks `[{use, label?, title?, count?, ratio?}]` |

**Entity:** `{ "id": "item", "fields": { "name": "string(1..60)", "expires": "date", "usedUp": "bool" } }`.

The field type grammar is: `string|text|int|number|bool|date|datetime|url|email|id`, optional length
`string(3..80)`, `enum(a|b|c)`, `ref(entity)`, a `[]` suffix for lists and a `?` suffix for optional fields.
For example: `"tags": "string[]?"`. Entities generate `.factory/docs/model.ts`.

**Role:** `{ "id": "member", "can": ["read-items", "edit-own-items"] }`. Required when `identity.required = true`.

**Decision:** any object. Exactly one type has engine meaning:
`{ "type": "user-confirmation", "value": "USER: <the user's exact words>" }`. The engine stamps it with the
current `revision`. Approval needs a confirmation stamped at the current revision, so any later change requires
a fresh one. Other decision types, such as `{"type":"design","value":"…"}`, are kept for the record.

## 5. Revisions and invalidation

| Change | Revision bump and approval dropped? | Finished tasks marked `stale` |
|---|---|---|
| A projected fact changes (stated/confirmed), or a conflict is raised | yes | screens whose `basis` names the key; `module-data` for `data.*`; `module-auth` for `identity.*`; every screen for `product.outcome`, `design.*`, `experience.navigation` |
| An inferred or proposed fact is recorded for a key that was never stated or confirmed | no | none |
| A screen is added or changed | yes | that screen's tasks |
| Entities change | yes | `module-data` (key `data.model`) |
| Roles change | yes | `module-auth` (key `identity.roles`) |
| A decision is added | yes | none |

Staleness propagates to finished tasks that depend on stale ones. Tasks not yet started never go stale. After
re-approval, `plan build` turns stale tasks back into `todo` (keeping `priorEvidence`) and keeps every finished,
unaffected task `done`.

## 6. Tasks

`plan build` (only when approved) generates:

| Task | Type | Depends on | When |
|---|---|---|---|
| `setup-project` | factory | none | always |
| `setup-design` | factory | setup-project | always |
| `module-auth` | agent | setup-project | `identity.required` |
| `module-data` | agent | setup-project | `data.required` |
| `implement-<component>` | agent-implement | setup-design | a screen uses a `candidate` component |
| `screen-<id>` | agent-compose | setup-design, the module tasks, its implement tasks | every screen |
| `verify-<id>` | factory | screen-<id> | every screen |
| `release-readiness` | user-gated | all verify tasks | always |

Statuses are `todo`, `done` and `stale`. `plan next` lists the `todo` tasks whose dependencies are done.

**Evidence rules** (`plan done <id> --evidence "…"`):
- The evidence must name an executed check: `tsc`, `typecheck`, `expo export`, `bundle`, `test`, `node --test`,
  `lint`, `pnpm`/`npm`/`npx`, `ran`, `passed`, `failed` or `exit`.
- A device, simulator or screen-reader claim needs the platform and OS version, e.g. `Android 16 Pixel 8`.
  Otherwise, say explicitly that it wasn't done.
- `release-readiness` needs evidence that starts with `USER-APPROVED:`.
- If a task's acceptance mentions visual or device review and the evidence has no device or browser proof, the
  task is still marked done, but it gets `gaps`. The gaps stay visible in the brief and in `workflow status`.

## 7. Fact keys

| Key | Asked in | Required | Condition |
|---|---|---|---|
| `product.outcome` | 02 | yes | |
| `product.audience` | 02 | yes | |
| `identity.required` | 02 | yes | boolean |
| `data.required` | 02 | yes | boolean |
| `experience.primary` | 02 | advisory | one of `catalog experiences` |
| `product.excluded` | 02 | advisory (standard mode) | list of out-of-scope items |
| `identity.method`, `identity.recovery` | 03 | yes | when `identity.required = true` |
| `data.persistence` | 03 | yes | when `data.required = true` |
| `data.source`, `data.offline` | 03 | no | when `data.required = true`; `data.source` drives `module.api-client`/`module.env` |
| `release.targets` | 03 | yes | e.g. `["ios","android"]` |
| `experience.navigation` | 04 | yes | |
| `design.direction` | 04 | yes | |
| `product.name`, `design.tone` | any | no | |

You may record other dotted lowercase keys (e.g. `content.moderation`). They're kept and briefed, but no gate
requires them.

## 8. Projections

`blueprint brief` writes `.factory/docs/BRIEF.md` (under ~1,500 tokens: workflow position, decisions with
sources, conflicts, screens, model, roles, readiness, gaps, next tasks), `SCREENS.md` (wireframes),
`DECISIONS.md` (quotes and history) and `model.ts`. Regenerate them; never edit them.

## 9. Engine errors and what to do

| Error (prefix) | Cause | Do |
|---|---|---|
| `No project: run project init first` | wrong `--project` dir | Find the right dir (SKILL.md §2) |
| `Project already exists` | `project init` on an existing project | Run `workflow status` instead |
| `Quote for K not found verbatim in sX:pY` | paraphrased quote | Copy the exact words from the anchor text shown in the error |
| `stated fact K needs a source quote` | no quote | Add `--quote`, or use `--status inferred` |
| `Invalid fact key` | not dotted lowercase | Use e.g. `data.source` |
| `K is conflicted; pass the chosen value` | confirming a conflict without a choice | Ask the user; `--values '{"K":…}'` |
| `Unsupported field X; facts go through interview record` | facts in a blueprint file | Move them to `interview record` |
| `Invalid type 'T' for entity.field` | bad field type | Use the grammar in §4 |
| `Blueprint blocked: N issue(s)` | audit not ready | Run `blueprint audit` and fix each problem |
| `User confirmation predates revision N` (audit) | the blueprint changed after the user confirmed | Show what changed and record a fresh confirmation |
| `Blueprint must be approved before planning construction` | `plan build` too early | Finish segment 05 |
| `Task not ready or already complete` | dependencies open or already done | `plan next` |
| `Evidence must name the checks you actually ran` | vague evidence | Name the commands and their results |
| `Device/screen-reader claims need the platform and OS version` | unbacked device claim | Add the platform and OS, or state it wasn't done |
| `User-gated task requires USER-APPROVED: evidence` | release without the user's words | Ask the user (08) |
| `Locally modified files would be overwritten` (module add) | app edited the module source | Merge by hand; never force |
