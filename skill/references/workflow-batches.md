# Documentation decision batches (opt-in)

After Requirements is complete, enable with:
```sh
node scripts/factory.mjs workflow batch init --project <dir>
node scripts/factory.mjs workflow next --project <dir>
node scripts/factory.mjs workflow batch set classification --project <dir> --file selection.json
```

Classification (MR 2): run `catalog apps` to list controlled application archetypes, then `catalog app <id>` to inspect its deterministic suggestions. Save only `{ "type": "tracker" }` (or another registered ID). After selection, `workflow next` provides suggested object, capability and page IDs for *later* batches; these are not yet resolved or implemented. Application archetypes are separate from the six visual Monad page archetypes.

Objects (MR 3): select **core object namespaces** as compact IDs, optionally declaring typed links. Example: `["program",{"id":"activity","relations":[{"to":"program","kind":"belongs-to"}]}]`. Link kinds: `belongs-to`, `has-many`, `references`. Only declared object IDs are valid targets; duplicate IDs, invalid relations, and circular `belongs-to` graphs fail before any state is saved. `workflow objects --project <dir>` resolves stable data/event/control/display namespaces. The next Functionality batch receives the resolved object contracts, but must independently select capability IDs; object declarations never imply working functionality.

Functionality (MR 4): use `catalog capabilities` and `catalog capability <operation>` to inspect registered semantic operations. Select exact IDs such as `["activity.search","activity.filter","activity.complete"]` for previously declared object namespaces. `auth.basic` is the only system-scoped capability. Requires and conflicts are validated against the complete selection (for example `filter` requires `search`; `read-only` conflicts with mutations). `workflow functionality --project <dir>` resolves deterministic event, control and display IDs for downstream page planning. These IDs represent **planning contracts only**, not implemented controls, authentication, or handlers; unsupported behaviors must not be claimed as working.

Pages (MR 5): run `catalog pages --type <app-type>` to inspect page pattern IDs or `catalog page <id>` for exact contracts. At the Pages batch, `workflow next` shows archetype defaults and capability coverage diagnostics; select a compact array of registered page IDs. `workflow pages --project <dir>` resolves routes, bound object namespaces, navigation links, and covered capability IDs. Validation rejects wrong-app patterns, duplicate routes, missing root, unreachable screens and uncovered capabilities; `auth.basic` requires both `auth.login` and `auth.register`. Page definitions and auth behavior are **planning-only**, not generated JSX, real authentication, or working navigation yet. For now the catalog binds page object roles by declaration order (0 = first object, 1 = second); later composition may make these semantic bindings explicit.

Composition (MR 6): select exactly one compact contract per chosen page ID, including `kind`, a compatible Monad `archetype`, and `bindings` with field IDs. Collections use `{title,description?,search?,filter?,media?}`, detail pages use `{heading,hero? (required for glance-dashboard),facts?,body?,progress?,unit?,media?}`, forms use `{fields:[...]}`, and settings use `{groups:[...]}`. Optional `navigation:[{to:"page-id",placement:"select|primary|header|action"}]` binds only catalog-authorized navigation; `actions:[{id:"object.operation",placement:"primary|action",field?:"boolean-field"}]` binds selected local-state capabilities. The compiler refuses unbound selected functionality, invalid field IDs, ambiguous primary actions, missing pages, incompatible subjects or routes. `workflow composition --project <dir>` returns a **draft** assembler-validated AppSpec with synthetic fixtures. It is not ready for approval or production until Content & Editorial replaces fixtures and the next MR audits the final revision. Authentication is not simulated as real auth and is rejected by the presentation compiler.

Use **one batch at a time**. Read only the indicated batch's existing upstream selections and relevant catalog. Save the selection as JSON; run `workflow next` again. Do not combine classifications, objects, capabilities or pages into one agent task.

Order: `classification` → `objects` → `functionality` → `pages` → `composition` → `content` → `review`.

Selections live in `.factory/project.json` under `batches.selections`. Repeating an identical selection is a no-op. Changing an earlier one removes downstream selections, invalidates approval and stales dependent completed screen work; completed upstream selections remain intact.

**Scope:** MR 6 builds a deterministic, validated draft AppSpec from page contracts, using the existing Monad renderer. It does not claim synthetic fixture content is production-ready or implement real auth or server-side operations. Editorial review and approval follow in MR 7. Do not claim the current batch contract is sufficient to produce an executable app. Existing projects without `batches` continue unchanged.
