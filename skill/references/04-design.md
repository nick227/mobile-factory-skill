# Segment 04 — Design

Decide the experience: how people move through the app, what each screen is for, what it shows in every state,
which real catalog parts it uses, and the shape of the data. The output is a set of screen contracts precise
enough that construction never has to guess.

## 1. Purpose and entry conditions

Enter design when `workflow status` reports `segment: "04-design"`, or when the user asks to change screens,
navigation, visual direction or data shape (even mid-build). Requirements must be complete. If they aren't,
`workflow status` will say 03.

## 2. Inspect state first

1. Run `workflow status`. In the `04-design` unmet list: `answer:experience.navigation`,
   `answer:design.direction`, `screens:defined`, `screen:<id>` (one per incomplete screen), `entities:defined`
   and `roles:defined`. `screens:basis` is advisory.
2. Run `blueprint brief` to see the decisions so far (outcome, audience, `experience.primary`, data and accounts).
   Design from these; don't re-ask them.
3. If a document was ingested, cite its behaviour paragraphs from the screens (`screens[].sources`).
4. Load `references/design/README.md` (the Focus-First Native rules). Load `screens.md` and `navigation.md`
   before proposing structure.

## 3. Required facts and decisions

| Condition id | Met when |
|---|---|
| `answer:experience.navigation` | `experience.navigation` is stated or confirmed (e.g. "Single stack: Pantry pushes Add item; native back", or "Tabs: Pantry · Expiring · Settings") |
| `answer:design.direction` | `design.direction` is stated or confirmed (factory defaults, or a described direction) |
| `screens:defined` | At least one screen exists |
| `screen:<id>` | That screen has `title`, `purpose`, `route`, ≥ 1 real catalog component, `states` with `loading` and `error`, `actions`, ≥ 1 `acceptance`, a valid `recipe` if set, and only existing `entities` |
| `entities:defined` | When `data.required = true`: at least one entity with typed `fields` |
| `roles:defined` | When `identity.required = true`: at least one role |
| `screens:basis` (advisory) | Every screen lists the fact keys it depends on. This makes later changes precise. |

## 4. Agent behaviour (reasoning procedure)

1. **Derive the journeys** from `product.outcome` and the scope: the 2–4 things a user does most. Each journey
   is a path through screens.
2. **Choose the structure** using the design standards. Collection → item is a *push*. Editing is a focused
   editor screen. Tabs are only for true peer areas. The default is a single stack for ≤ 5 screens.
3. **Map each screen to a content family** (overview, collection, detail, editor, focus) and to a recipe, if one
   fits (`recipe.collection-screen`, `recipe.detail-screen`, `recipe.form-screen`, `recipe.settings-screen`,
   `recipe.onboarding-pager`). Load `06-catalog.md` for parts. That doesn't change the active segment.
4. **Write the contract** for each screen. The purpose is one sentence. States cover loading, error, empty and
   saving where relevant. Actions are verbs. Acceptance criteria are testable by someone who has never seen the
   conversation. `basis` lists the keys the screen depends on.
5. **Define the entities** with the type grammar (`references/factory-state.md` §4). Include only the fields the
   screens use.
6. **Show the wireframes** (`wireframe all`). Iterate with the user on structure and content, not on pixels.
7. **Persist** with `blueprint set` after each agreed change. Ids merge, so send only what changed.

## 5. User interaction

- Present **2–3 structural options** at most, with a recommendation. For example: "A: one list with Add (simplest);
  B: tabs for All / Expiring soon. I recommend A for v1."
- Show wireframes for review: "Here's the Pantry screen. Anything missing or in the wrong order?"
- Ask about content and priorities ("What should a row show: name, quantity, days left?"), not about
  components or code.
- Record navigation and direction answers as facts with the user's words: `interview record --key experience.navigation …`.
- If the user says "use your defaults" for the visual direction, record the factory default as stated, using their words as the quote.

## 6. Commands and schemas

```bash
node scripts/factory.mjs interview record --project <dir> --key experience.navigation --value '"Single stack: Pantry pushes Add item; native back"' --quote "one list, push to add"
node scripts/factory.mjs interview record --project <dir> --key design.direction --value '"Factory Focus-First Native defaults"' --quote "use your defaults"
node scripts/factory.mjs catalog search "list with empty state"                     # see 06-catalog.md
node scripts/factory.mjs blueprint set --project <dir> --file blueprint.json
node scripts/factory.mjs wireframe all --project <dir>
node scripts/factory.mjs workflow status --project <dir>
```

A complete blueprint for Pantry Pal (every id is a real catalog id; the `recipe` values are checked):

<!-- validate: blueprint @04-design -->
```json
{
  "screens": [
    {
      "id": "pantry", "title": "Pantry", "purpose": "See items, soonest expiry first", "route": "/",
      "components": ["primitives.screen", "composites.listitem", "composites.emptystate", "controls.calmskeleton", "controls.button"],
      "recipe": "recipe.collection-screen",
      "states": ["loading", "error", "empty", "ready"],
      "actions": ["open-item", "add-item"],
      "acceptance": ["Items sorted by expiry ascending", "Empty state offers Add item", "Error state offers Retry"],
      "basis": ["product.outcome", "data.persistence"], "entities": ["item"]
    },
    {
      "id": "item-new", "title": "Add item", "purpose": "Add one item in a few seconds", "route": "/items/new",
      "components": ["primitives.screen", "controls.textfield", "patterns.actionfooter"],
      "recipe": "recipe.form-screen",
      "states": ["loading", "error", "saving"],
      "actions": ["save", "cancel"],
      "acceptance": ["Name 1..60 chars required", "Save returns to Pantry with the item in expiry order", "Failed save keeps input"],
      "basis": ["data.persistence"], "entities": ["item"]
    }
  ],
  "entities": [
    { "id": "item", "fields": { "id": "id", "name": "string(1..60)", "quantity": "int", "expires": "date", "usedUp": "bool" } }
  ]
}
```

Change one field later by sending only that: `{"screens":[{"id":"pantry","purpose":"See items, soonest expiry first, with counts"}]}`.

## 7. Outputs and examples

**Design proposal turn:**

> For v1 I suggest **one list screen** (soonest expiry first) with **Add item** pushing a short form. Native
> back, no tabs. Here's the list:
>
> ```
> ┌──────────────────────────────────┐
> │ PANTRY                           │
> │ /                                │
> ├──────────────────────────────────┤
> │ ▢ Item 1                         │
> │   description                    │
> ...
> ```
> Rows show the name, quantity and "3 days left". Does that cover what you need to see at a glance?

**Segment summary:** "Design settled: 2 screens, single stack, 1 entity (item). Next: your approval of the blueprint."

## 8. Completion criteria

`04-design` shows `complete: true`. Also check two things the engine can't: each acceptance criterion is testable,
and every journey from §4 step 1 is reachable through the routes. Fill `screens:basis` before leaving. It's cheap,
and it limits what a future change reopens.

## 9. Failure and contradiction handling

| Situation | Handling |
|---|---|
| `Unknown catalog component` / `Unknown recipe` | Search the catalog (`06-catalog.md`) and replace the id. Never invent ids. |
| A needed capability has only a `candidate` component | Keep it. `plan build` will create an `implement-*` task. Tell the user it adds build work. |
| `Invalid type` in entity fields | Fix it using the grammar in `factory-state.md` §4 |
| `Unsupported field … facts go through interview record` | Move facts out of the blueprint file |
| The user wants something the standards forbid (e.g. swipe-only navigation) | Explain the accessible alternative (`navigation.md`: gestures need a tappable alternative) and offer a compliant variant |
| Design reveals a new requirement (e.g. sharing) | Record it as a fact (03). That may reopen requirements or discovery. Don't hide it in a screen. |

## 10. Transitions and revisit rules

- **Advance to 05** when the gate is met. Show the brief and ask for approval there.
- **Revisit 04** when the user changes screens, navigation, direction or data shape. Use `blueprint set` with only the
  changed ids. Approval drops, and only the touched screens' finished tasks go stale. Global keys
  (`experience.navigation`, `design.*`, `product.outcome`) stale every screen, so change them deliberately.
