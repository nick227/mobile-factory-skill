# Documentation decision batches (opt-in, MR 1 foundation)

After Requirements is complete, enable with:
```sh
node scripts/factory.mjs workflow batch init --project <dir>
node scripts/factory.mjs workflow next --project <dir>
node scripts/factory.mjs workflow batch set classification --project <dir> --file selection.json
```

Use **one batch at a time**. Read only the indicated batch's existing upstream selections and relevant catalog. Save the selection as JSON; run `workflow next` again. Do not combine classifications, objects, capabilities or pages into one agent task.

Order: `classification` → `objects` → `functionality` → `pages` → `composition` → `content` → `review`.

Selections live in `.factory/project.json` under `batches.selections`. Repeating an identical selection is a no-op. Changing an earlier one removes downstream selections, invalidates approval and stales dependent completed screen work; completed upstream selections remain intact.

**MR 1 scope:** batch shape and ordering validation only. Application archetype IDs, catalog-backed feature checks, page expansion, composition and semantic review will be introduced by later MRs. Do not claim the current batch contract is sufficient to produce an executable app. Existing projects without `batches` continue unchanged.
