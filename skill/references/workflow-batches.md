# Documentation decision batches (opt-in)

After Requirements is complete, enable with:
```sh
node scripts/factory.mjs workflow batch init --project <dir>
node scripts/factory.mjs workflow next --project <dir>
node scripts/factory.mjs workflow batch set classification --project <dir> --file selection.json
```

Classification (MR 2): run `catalog apps` to list controlled application archetypes, then `catalog app <id>` to inspect its deterministic suggestions. Save only `{ "type": "tracker" }` (or another registered ID). After selection, `workflow next` provides suggested object, capability and page IDs for *later* batches; these are not yet resolved or implemented. Application archetypes are separate from the six visual Monad page archetypes.

Objects (MR 3): select **core object namespaces** as compact IDs, optionally declaring typed links. Example: `["program",{"id":"activity","relations":[{"to":"program","kind":"belongs-to"}]}]`. Link kinds: `belongs-to`, `has-many`, `references`. Only declared object IDs are valid targets; duplicate IDs, invalid relations, and circular `belongs-to` graphs fail before any state is saved. `workflow objects --project <dir>` resolves stable data/event/control/display namespaces. The next Functionality batch receives the resolved object contracts, but must independently select capability IDs; object declarations never imply working functionality.

Use **one batch at a time**. Read only the indicated batch's existing upstream selections and relevant catalog. Save the selection as JSON; run `workflow next` again. Do not combine classifications, objects, capabilities or pages into one agent task.

Order: `classification` → `objects` → `functionality` → `pages` → `composition` → `content` → `review`.

Selections live in `.factory/project.json` under `batches.selections`. Repeating an identical selection is a no-op. Changing an earlier one removes downstream selections, invalidates approval and stales dependent completed screen work; completed upstream selections remain intact.

**Scope:** MR 3 adds object namespace and relationship validation, but does not create handlers, controls, display bindings, or data models. Capability resolution, page expansion, composition and semantic review follow in later MRs. Do not claim the current batch contract is sufficient to produce an executable app. Existing projects without `batches` continue unchanged.
