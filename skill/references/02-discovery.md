# Segment 02 — Discovery

Understand the product well enough that requirements can be extracted: what it's for, who uses it, what they
accomplish, what's out of scope, and whether it needs accounts and stored data. Discovery is a conversation
about the product, not about screens or code.

## 1. Purpose and entry conditions

Enter discovery when:
- no factory project exists and the user wants a new app (and the fast path doesn't apply); or
- `workflow status` reports `segment: "02-discovery"`; or
- new information changes the product's intent or scope (for example "it's for clinics now, not households"),
  even mid-build.

Don't enter discovery for implementation detail changes, or for a new fact about an already-understood product.
Those go to 03 or 04.

## 2. Inspect state first

1. `workflow status --project <dir>`: read `segments[0].unmet` (`02-discovery`) and its `advisory` list.
2. If a project exists, run `interview next --project <dir>`. It returns only open work: `confirm-assumptions`,
   `mine-source`, then `ask` items in priority order. It never repeats an answered key.
3. Look at what the user has already given you (the first message, attachments, earlier turns). **Mine before you
   ask.** If a document exists, run `source add` first (§6). Mining it often completes 02 and most of 03 in one pass.

## 3. Required facts and decisions

| Condition id | Fact | Required | What "good" looks like |
|---|---|---|---|
| `fact:product.outcome` | `product.outcome` | yes | One sentence of user value: "Track food at home so nothing expires unused", not "a food app" |
| `fact:product.audience` | `product.audience` | yes | A specific person in a situation: "busy home cooks who shop weekly" |
| `fact:identity.required` | `identity.required` | yes | `true`/`false`. Accounts only if users need identity, sync or permissions. |
| `fact:data.required` | `data.required` | yes | `true` if anything must survive an app restart or be shared |
| `fact:experience.primary` | `experience.primary` | advisory | One id from `catalog experiences` (e.g. `browse-collection`, `form-entry`, `dashboard`) |
| `fact:product.excluded` | `product.excluded` | advisory (standard mode) | Explicit non-goals for v1, as a list |

For discovery, a fact counts as known in any status: `inferred` and `proposed` are fine here. Segment 03 makes
them `stated` or `confirmed`. Also capture `product.name` when it's mentioned. It's free and makes the brief readable.

## 4. Agent behaviour (reasoning procedure)

Each turn, think through these steps in order:

1. **Known:** what has the user stated or written? Record it with their words as the quote.
2. **Inferable:** what follows with reasonable confidence? For example, "remember my items" means
   `data.required = true`, and "just me on my phone" means `identity.required = false`. Record it with
   `--status inferred`; the user confirms it later in one batch.
3. **Ambiguous:** which open decision has the most downstream impact? Accounts and stored data change the whole
   architecture. Audience and outcome change every screen. Ask about those first.
4. **Not yours to ask:** libraries, component names, colours, file layout, API shape. Never ask these in discovery.
5. **Persist,** then re-run `workflow status`. Stop asking as soon as the four required facts are known.

Choosing the mode at `project init`:
- `--mode lite`: a one-sentence idea for a small personal or utility app. The factory proposes defaults
  (no accounts, no persistence, a single stack, factory design, iOS and Android). The user confirms or corrects
  them in one message in 03. Lite mode only asks priority-1 questions.
- `--mode standard`: multiple user types, accounts, shared data, payments, more than ~5 screens, or a document-based spec.

## 5. User interaction

- One turn asks **at most 4 questions**, numbered, each with a suggested answer the user can accept with "yes".
- Offer concrete alternatives where the user is likely unsure. For example, "Just you on one phone, or shared
  between household members (needs accounts and sync)?"
- If the user gives a complete spec, ask nothing. Ingest it, mine it and move on.
- If an answer is vague, ask one follow-up at most. Then record your best inference as `inferred` and let 03 confirm it.
- Never ask about anything `interview next` doesn't list as open, unless the user's own words raised it.

## 6. Commands and schemas

```bash
node scripts/factory.mjs project init --project <dir> --name "Pantry Pal" [--mode lite|standard]
node scripts/factory.mjs source add --project <dir> --file spec.md --title "Pantry Pal spec"   # documents only
node scripts/factory.mjs interview next --project <dir>
node scripts/factory.mjs interview record --project <dir> --key product.outcome \
  --value '"Track food at home so nothing expires unused"' --quote "so my household stops wasting food"
node scripts/factory.mjs interview record --project <dir> --file findings.json             # several facts at once
node scripts/factory.mjs catalog experiences                                                # to propose experience.primary
node scripts/factory.mjs workflow status --project <dir>
```

The findings file shape is a list of `{key, value, status?, source?, note?}` items, or `{skip:[anchors]}`
(`references/factory-state.md` §2). Example after the user said *"I want an app so my household stops wasting
food that expires in the cupboard"*:

<!-- validate: findings @02-discovery -->
```json
[
  { "key": "product.outcome", "value": "Track food at home so nothing expires unused", "source": { "id": "chat", "quote": "so my household stops wasting food that expires" } },
  { "key": "product.audience", "value": "Members of one household", "status": "inferred", "note": "user said 'my household'" },
  { "key": "data.required", "value": true, "status": "inferred", "note": "must remember items between sessions" }
]
```

`identity.required` is still open after this. Whether a household shares one list (which needs accounts) is the
highest-impact question, so ask it next.

## 7. Outputs and examples

**A good discovery turn** (after recording the findings above):

> Got it: an app that helps your household use food before it expires. I've noted that it needs to remember
> your items. Three quick questions:
> 1. **Who uses it?** Just you on one phone, or several household members sharing one pantry? (Sharing needs accounts and sync.)
> 2. **What must v1 do?** My guess: add items with an expiry date, see what expires soonest, mark items used. Anything else?
> 3. **What's out for v1?** For example shopping lists, barcode scanning, recipes.

**A bad discovery turn:** "Which state management library do you prefer, and should the list use FlatList?"
That's implementation detail, and it's asked in the wrong segment.

**A segment summary** when 02 completes, as one line before moving on:
"Discovery done: household food tracker for busy home cooks · no accounts · stores data on the phone.
Next: confirming details (requirements)."

## 8. Completion criteria

`workflow status` shows `02-discovery` with `complete: true`. That means all four required facts exist in any
status. Before advancing, check that your summary of the product would make sense to the user in one sentence.
If it wouldn't, the outcome fact is too vague. Improve it.

## 9. Failure and contradiction handling

| Situation | Handling |
|---|---|
| The user won't decide accounts or data | Record the safest small default (`false`) as `inferred`, with a note, and say it can change later |
| The user contradicts an earlier answer | Record the new value. The engine keeps history and drops approval if it was projected. Say what changed in one line. |
| A recorded value contradicts a clear consequence (e.g. data stored, but `data.required` is false) | The engine raises a conflict. Ask the user to choose; it's resolved in 03. |
| The user wants to jump to screens or code | Acknowledge the request, record any facts it reveals, and continue discovery only while required facts are missing. Once 02 completes, design follows quickly. |
| `Quote … not found verbatim` | Copy the user's words exactly, or use `--status inferred` |

## 10. Transitions and revisit rules

- **Advance to 03** when the gate is met. Don't announce a ceremony; just continue with the next open item from
  `interview next`.
- **Skip straight past 02** when a spec already answers everything. Mining it in 03 satisfies these conditions too.
- **Revisit 02** only when product intent, audience or scope changes, not for implementation or screen-level
  changes. Revisiting doesn't reset the project. Record the new facts, and the engine stales only the dependent work.
