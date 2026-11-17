# Segment 03 — Requirements

Turn what's known into a complete, sourced, consistent set of facts. Every document paragraph is accounted for,
every assumption is confirmed by the user, every conflict is resolved, and every required answer is stated.
This is the segment where the factory's provenance matters most: each decision can be traced to the user's
words or a document anchor.

## 1. Purpose and entry conditions

Enter requirements when:
- `workflow status` reports `segment: "03-requirements"` (discovery is complete); or
- the user adds or revises a document (`source add`); or
- a recorded fact raises a conflict, or the user changes a fact, at any later stage.

## 2. Inspect state first

1. Run `workflow status`: the `03-requirements` unmet list names exactly what's missing (`sources:mined`,
   `conflicts:none`, `facts:confirmed`, `answer:<key>`).
2. Run `interview next`. Items come back in this order: `resolve-conflict` → `confirm-assumptions` →
   `mine-source` (batches of up to 6 anchors) → `ask` → `catalog-suggestions`. Work them in that order.
   While any document is unmined, no `ask` items are shown, by design: the document may already hold the answer.
3. Read `.factory/docs/DECISIONS.md` (from `blueprint brief`) only if you need quote history.

## 3. Required facts and decisions

| Condition id | Met when |
|---|---|
| `sources:mined` | Every anchor in every source is cited by a fact, a screen's `sources`, a conflict, or a `skip` |
| `conflicts:none` | `conflicts` is empty |
| `facts:confirmed` | No fact is `proposed` or `inferred` |
| `answer:product.outcome`, `answer:product.audience`, `answer:identity.required`, `answer:data.required` | The discovery facts are `stated` or `confirmed` |
| `answer:identity.method`, `answer:identity.recovery` | Stated or confirmed, when `identity.required = true` |
| `answer:data.persistence` | Stated or confirmed, when `data.required = true` |
| `answer:release.targets` | Stated or confirmed |

`answer:<key>` is listed only for keys that aren't already waiting in `facts:confirmed`. Useful optional facts
(no gate): `data.source` (`api`, `mock`, `local`; it selects the `module.api-client` and `module.env` modules),
`data.offline`, `product.name`, `design.tone`.

## 4. Agent behaviour (reasoning procedure)

1. **Resolve conflicts first.** They block approval, and they usually signal a real misunderstanding.
2. **Mine documents in batches.** For each anchor in a `mine-source` batch, decide one of three things:
   - it states a fact → record it with `{anchor, quote}` (the quote is a verbatim fragment of the anchor text or heading);
   - it describes a capability or behaviour (e.g. "Mark an item as used up") → record it as a `feature.<name>`
     fact citing the anchor. Design (04) turns the `feature.*` facts into screens and acceptance criteria, so
     nothing in the document is lost between segments;
   - it holds no requirement (marketing copy, background) → `skip`.

   Record a whole batch in one `interview record --file`. It's atomic: one bad quote saves nothing, so fix that
   quote and resend.
3. **Infer to save the user's time.** If the spec says "works offline; data stays on the phone", record
   `data.persistence` as stated from that anchor; don't ask the user. Use `inferred` only when the text implies
   rather than says it.
4. **Batch every assumption** into one confirmation message. Never confirm one fact per turn.
5. **Ask** only for required answers no source provides, ordered by downstream impact.
6. **Persist, then re-run `workflow status`.** Implications may add inferred facts, or raise conflicts, that need
   the next confirmation.

## 5. User interaction

- **Confirmation message:** list the assumptions as plain statements, plus anything you'll default. Ask for
  "yes" or corrections. Then run `interview confirm all --quote "<their reply>"`. If they correct some values,
  record the corrections first (stated), then confirm the rest by key.
- **Conflict message:** show both options with where each came from. Recommend one, and say why.
- Never show the user anchor ids or JSON. Translate them: "Your spec says data stays on the phone…".

## 6. Commands and schemas

```bash
node scripts/factory.mjs source add --project <dir> --file spec.md --title "Pantry Pal spec"
node scripts/factory.mjs interview next --project <dir>
node scripts/factory.mjs interview record --project <dir> --file findings.json
node scripts/factory.mjs interview confirm all --project <dir> --quote "yes, all correct"
node scripts/factory.mjs interview confirm data.required --project <dir> --values '{"data.required":true}' --quote "yes it stores our items"
node scripts/factory.mjs workflow status --project <dir>
```

Example: mining the first batch of the Pantry Pal spec. The anchors are `s1:p1` … `s1:p7`, and each quote is
copied from the anchor text:

<!-- validate: findings @03-requirements -->
```json
[
  { "key": "product.outcome", "value": "Track food at home so nothing expires unused", "source": { "anchor": "s1:p1", "quote": "track what food they have at home so nothing expires unused" } },
  { "key": "product.audience", "value": "Busy home cooks who shop weekly", "source": { "anchor": "s1:p2", "quote": "busy home cooks who shop once a week" } },
  { "key": "product.excluded", "value": ["shopping lists", "barcode scanning", "household sharing"], "source": { "anchor": "s1:p6", "quote": "Not in v1: shopping lists, barcode scanning, sharing between households" } },
  { "key": "data.persistence", "value": "device storage (offline)", "source": { "anchor": "s1:p7", "quote": "data stays on the phone" } },
  { "key": "data.offline", "value": true, "source": { "anchor": "s1:p7", "quote": "Works offline" } },
  { "key": "feature.add-item", "value": "Add items with name, quantity and expiry date", "source": { "anchor": "s1:p3", "quote": "Add items with a name, quantity and expiry date" } },
  { "key": "feature.expiry-order", "value": "List items soonest expiry first", "source": { "anchor": "s1:p4", "quote": "See items that expire soonest first" } },
  { "key": "feature.mark-used", "value": "Mark an item as used up", "source": { "anchor": "s1:p5", "quote": "Mark an item as used up" } }
]
```

This one batch cites all seven anchors, so `sources:mined` is met. The `feature.*` facts become 04's checklist:
every feature must be reachable through some screen. The result of the record call lists `changed`, `conflicts`, `implied` (for example "data.required = true (implied by …)") and any
`staleTasks`.

## 7. Outputs and examples

**Confirmation turn:**

> From your spec I've got: busy home cooks; add items with name, quantity and expiry; soonest expiry first;
> works offline on the phone; no accounts; no shopping lists, scanning or sharing in v1.
> I'll assume **iPhone and Android** as targets. Is all of that right? A "yes" or corrections is all I need.

Then run `interview confirm all --quote "yes"`, and record `release.targets` as stated from their reply.

**Conflict turn:**

> Two things disagree: earlier you said "nothing needs saving", but you also want items kept on the phone.
> Should Pantry Pal **store items on the device** (recommended, since it's the core feature) or keep nothing between launches?

## 8. Completion criteria

`03-requirements` shows `complete: true`: no unmined anchors, no conflicts, no unconfirmed assumptions, and every
required answer stated or confirmed. Summarise in one line, for example: "Requirements confirmed (7 decisions,
spec fully mined). Next: design."

## 9. Failure and contradiction handling

| Situation | Handling |
|---|---|
| A batch is rejected (`not found verbatim`) | Nothing was saved. Copy the exact fragment from the anchor text in the error and resend the whole batch. |
| Two document anchors state different values | The engine records a conflict automatically. Ask the user. |
| A stated fact contradicts a confirmed one (e.g. `data.persistence` set while `data.required` is false) | The `record` result lists the key under `conflicts`. Ask the user and resolve it with `--values`. A resolved conflict isn't raised again. |
| The user rejects a lite default | Record their value as stated (it replaces the proposal), then confirm the rest |
| A revised spec arrives | Run `source add` with the new file. Unchanged paragraphs carry over; mine only the new ones. |
| The user is unavailable for confirmation | Don't confirm on their behalf. Continue to 04 design work that doesn't depend on the unconfirmed facts, and keep the confirmation pending. Approval (05) stays blocked. |

## 10. Transitions and revisit rules

- **Advance to 04** when the gate is met.
- In lite mode, the single confirmation reply often completes 03 *and* the design facts (`experience.navigation`,
  `design.direction`) at once. Re-run `workflow status`; you may land directly in 04 with only screens left to define.
- **Revisit 03** whenever a fact changes later. Record the change (history is kept); approval drops and dependent
  finished tasks go stale. Then follow `workflow status` forward again. Don't re-mine documents or re-ask settled facts.
