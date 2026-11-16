---
name: mobile-development
description: Build Expo React Native apps by selecting approved factory source, screen patterns, and native Focus-First design standards. Use for mobile development, existing-app UI refactors, and new Expo applications.
---

# Mobile Development Skill v0.6

This folder is a **generated release** of the Mobile Software Factory. `library/` contains actual TSX source and `catalog.json` records approved components and preview maturity. The skill does not depend on the factory repository at runtime.

## Default workflow

1. Inspect the app and requirements; preserve existing constraints.
2. Read `catalog.json`. Select controls/composites/patterns before inventing UI.
3. Read `references/design/README.md`, `screens.md`, `geometry.md`, and `rendering.md` when designing screens. Use Focus-First Native defaults.
4. For new apps copy `templates/expo-app/`. Install compatible Expo dependencies.
5. Run `node scripts/install-source.mjs library catalog.json /path/to/app --all` from the unpacked skill. This currently installs the full library to avoid unresolved transitive dependencies; `--components` is not selective installation.
6. Compose in app features and Expo Router route files. Use the installed `src/ui` source, not independently generated replacements.
7. Ensure focused flows, minimal navigation chrome, stable media aspect ratios, measured tap areas, calm loading, and recoverable error states.
8. Validate types/interactions/devices **only to the extent actually executed**. Report gaps without pretending a preview component is certified.

## Structural boundaries

- Expo SDK 58 baseline, React Native 0.88, strict TypeScript, Expo Router.
- `foundation → primitives → controls → composites → patterns`. No upward UI imports.
- One canonical implementation; apps own copied source. Never overwrite local customizations without explicit approval.
- No replacement UI kit, custom router, or screen-level decorative design system.
- Factory is source-of-truth, this ZIP is a frozen distribution; propose reusable fixes upstream.

Read `references/architecture.md`, `references/quality.md`, and included `references/design/` for detailed policy.
