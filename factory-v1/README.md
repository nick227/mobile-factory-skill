# Mobile Software Factory v1.0 — Blueprint foundation

An **additive, local CLI API** for deliberate planning and small-context construction. This update leaves `packages/ui/src`, Expo Lab, all v0.6 design standards, and the component registry untouched.

## Key outcomes
- Canonical `.factory/project.json`, with approved revisions and conditional questions.
- Catalog discovery backed by the **real** `packages/catalog/registry.json` (32 existing components), not invented component APIs.
- Readiness audit verifies each screen's purpose, route, catalog components, loading/error states, actions, and acceptance criteria.
- Explicit user approval gate. Editing the specification invalidates approval and prior task graph.
- Dependency-aware work units and small, self-contained task packages for new AI sessions.
- Readable Markdown projections from the canonical project state.
- Factory's existing 10 governance checks run alongside the new v1.0 checks.

## CLI
Run at factory root: `pnpm factory help` or `node scripts/factory.mjs help`.

```bash
pnpm factory project init --project /tmp/neighborhood-app --name "Neighborhood Events"
pnpm factory workflow status --project /tmp/neighborhood-app   # active segment + unmet conditions (orchestrator.mjs)
pnpm factory discovery next --project /tmp/neighborhood-app
pnpm factory catalog search --query media
pnpm factory catalog get composites.mediaframe
pnpm factory project update --project /tmp/neighborhood-app --file factory-v1/examples/neighborhood.patch.json
pnpm factory blueprint audit --project /tmp/neighborhood-app
pnpm factory blueprint export --project /tmp/neighborhood-app
# Only after explicit user approval and recording the confirmation in the project:
pnpm factory blueprint approve --project /tmp/neighborhood-app
pnpm factory plan build --project /tmp/neighborhood-app
pnpm factory plan next --project /tmp/neighborhood-app
pnpm factory plan task screen-discover --project /tmp/neighborhood-app
```

The included `examples/neighborhood.patch.json` is a **fictitious** complete planning example, not an approval by a real user. Do not approve it as real user work.

## Project patch contract
`project update --file` accepts a JSON object containing any of `answers`, `screens`, `entities`, `integrations`, `roles`, `decisions`. Answers merge, other arrays replace. **Revision bumps and invalidates construction approval**. Catalog IDs must match real factory entries. Fields beyond these are rejected.

For every screen: `id` (lowercase hyphenated), `title`, `purpose`, `route`, `components` (real catalog IDs), `states` including `loading` and `error`, `actions` (array), `acceptance` (array). Future schema versions can add richer interaction and fixtures contracts.

## Intentionally not in this update
No automatic JSX authoring, mock database population, auth provider scaffolding, deployment, browser screenshot comparison, or automated UI certification yet. The AI composes JSX using curated code and this phase only scaffolds deterministic context/roadmap management. The generated standalone skill ZIP bundles the v1 workflow reference, project API, and catalog (plus all curated v0.6 UI source).

## Upgrade safety
The updater is **additive and conflict-averse**. It does not replace the v0.6 UI library or reinstall packages. Root `package.json` and `skill/SKILL.md` receive small, guarded edits with backups. `--dry-run` is available; a conflict stops all changes. Existing versioned output remains until `pnpm skill:build` is invoked.
