---
name: mobile-development
description: Build Expo React Native apps from approved factory source: a searchable component catalog, typechecked screen recipes, optional construction modules (navigation, API/mock data, persistence, validation, env, error recovery, auth) and Focus-First design standards. Use for new Expo apps and existing-app UI work.
---

# Mobile Development Skill

A frozen release of the Mobile Software Factory. All commands are `node scripts/factory.mjs …`, run from this folder. Expo SDK 58, React Native 0.88, strict TypeScript, Expo Router.

## Choose the path
- **Fast path:** use it for a small app (≤ ~5 screens) whose spec is already approved, built in one session. Skip the interview, blueprint and plan commands entirely. Do steps 2–5 below, choosing modules yourself from `references/foundations.md` (`module add` doesn't need a project).
- **Blueprint path:** use it when requirements are still being discovered, the app is larger, approval is still pending, or the work spans sessions or agents. Do steps 1–5.

## Build workflow (new app)
1. **Plan (blueprint path only):** follow `references/production-workflow-v1.md`. Use `--mode lite` for small apps. If the user has already approved a written spec, ingest it with `source add` and record that approval; otherwise get explicit approval before writing code.
2. **Find parts:** `catalog search "<need>"` (e.g. "searchable list", "save data on device", "confirm destructive"), then `catalog get <id> --role construct`. That returns the import line, props, constraints and warnings, and for `recipe.*` the full screen code. Don't read library source to learn APIs.
3. **Create the app:**
   - Copy `templates/expo-app/` to the app folder.
   - Install the UI with `node scripts/install-source.mjs library catalog.json <app> --all`.
   - Get modules with `module recommend --project <app>`, then install them with `module add <ids> --app <app>`.
   - Run the printed `npx expo install …`.
4. **Compose screens:**
   - Copy the matching recipe from `recipes/` into `src/recipes/` and adapt it.
   - Import UI from `@/src/ui` and modules from `@/src/foundations/<module>/…`.
   - Put feature code in `src/features/<feature>/` (`schema.ts`, `api.ts`, `mock.ts`, `store.ts`). See `references/foundations.md`.
5. **Verify only what you run:** `npx tsc --noEmit` and `npx expo export --platform android|ios`. On the blueprint path, name these in `plan done --evidence`. Bundles and types aren't device testing; say so.

If `npx expo install` doesn't change `package.json`, your npm config may have `save=false`. Re-run it as `npm_config_save=true npx expo install …`. Re-running `module add` is safe, and it reports `expoInstall: null` once every dependency is recorded.

## Rules
- Use the installed `src/ui` components and recipes. Don't write replacements.
- Every screen has loading, error and empty states. Media has a fixed aspect ratio. There's one primary action per screen. Destructive actions are confirmed with `AlertDialog`.
- Import Expo Router's `Stack` in `app/_layout.tsx`. Import the UI `Stack` in screens.
- Catalog maturity is computed from evidence. Nothing is `verified` without recorded iOS and Android device evidence.
- Apps own copied source. The installers never overwrite local edits.

Design policy: `references/design/` (Focus-First Native), `references/architecture.md`, `references/quality.md`, `references/catalog-contract.md`.
