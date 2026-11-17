# Catalog information contract (`factory.catalog.contract/1`)

The catalog serves three agent roles. Each role gets a compact, role-specific view instead of the whole catalog:

| Role | Question it answers | View (`catalog get <id> --role …`) |
|---|---|---|
| `interview` | What experiences can we offer? | summary, experiences, capabilities, maturity |
| `document` | What exactly does it do and need? | + props, constraints, dependencies, requires, compatibility |
| `construct` | How do I use it correctly right now? | import line, props, constraints, dependencies, requires, recipe, warnings |

## Ownership: two files, no shared fields

| File | Owner | Holds |
|---|---|---|
| `packages/catalog/registry.json` | UI foundation (Antigravity) | **Registration and installation facts:** `id`, `name`, `category`, `status` (claimed maturity), `source`, `exportName`, `showcase`, `test`, and optionally `npm` / `requires` once the installer supports them. |
| `packages/catalog/contracts.json` | Agent contract (Claude) | **Agent-facing semantics:** `summary`, `capabilities`, `experiences`, `props`, `constraints`, `recipe`, `compat`, `evidence`. |
| `packages/catalog/recipes/*.tsx` | Agent contract (Claude) | Multi-component compositions. They're real TSX that typechecks against `packages/ui/src`. |

`factory-v1/catalog-contract.mjs` merges the two files at read time. No field may be defined in both files; `pnpm check` (`tests/catalog-contract.test.mjs`) enforces this.

## Stable identifiers

- **Components:** `<category>.<lowercase name>`, e.g. `controls.button`. They never change after release. A rename creates a new id, and the old one gets `"replacedBy"`.
- **Compositions:** `recipe.<kebab-name>`, e.g. `recipe.collection-screen`.
- **Construction modules:** `module.<kebab-name>`, e.g. `module.api-client` (see `foundations/`).

## Maturity is computed, never asserted

Effective maturity is the **lower** of the registry's claimed `status` and the level the recorded `evidence` supports.

| Level | Requires |
|---|---|
| `candidate` | Catalog record only. |
| `implemented` | Source file and public export exist. |
| `tested` | + an automated behaviour test. Mocked React Native tests count here **and nowhere higher**. |
| `verified` | + passing `ios-*` **and** `android-*` evidence (device or simulator) with date and ref; plus `web-browser` if `compat.platforms` includes `web`. |
| `recommended` | + `verified`, and an evidence record of type `design-review` approving it. |

Evidence records look like this:

```json
{ "type": "ios-device|ios-simulator|android-device|android-emulator|web-browser|unit-mocked|types|design-review",
  "result": "pass|fail", "date": "YYYY-MM-DD", "ref": "path or command", "env": "e.g. iPhone 15 / iOS 19 / SDK 58", "by": "agent or person" }
```

TypeScript passing, a JS bundle building, or mocked tests passing **never** produce `verified`. If the registry claims more than the evidence supports, the view reports `claimUnsupported: true` and the construction view adds a warning.

## Dependencies are derived, not hand-written

`dependencies.npm` comes from the bare imports across the component's internal import closure. `dependencies.files` is the closure itself. Neither is hand-maintained, so they can't drift. `requires` (providers or host elements the app must mount, e.g. `SafeAreaProvider`, `PortalHost`) is declared in the contract, because source scanning can't see it.

## Capability vocabulary

`capabilities` use the controlled vocabulary in `contracts.json#/vocabulary`. Unknown capability ids fail validation, which keeps searches reliable. `experiences` are interview-level phrases (e.g. `browse-collection`, `guided-setup`) that map one product idea to a set of items.
