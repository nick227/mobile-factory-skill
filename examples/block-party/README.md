# Block Party: a demonstration app built from factory source

This is the benchmark spec (`bench/spec/neighborhood-events.md`) implemented with the factory's catalog recipes and construction modules. Only the app's own files live here (`app/`, `src/features/events/`). Everything else is assembled from current factory source, so the example can't drift from the library:

```bash
node examples/build-example.mjs block-party /tmp/demo
cd /tmp/demo/block-party && pnpm install
npm_config_save=true npx expo install expo-secure-store expo-sqlite zod
npx tsc --noEmit && npx expo export --platform android
```

| | Lines (non-blank, non-comment) |
|---|---|
| App-authored code (`app/`, `src/features/`, plus the copied root layout) | 124 |
| Factory recipes used | 96 |
| Factory UI library and modules installed (only part of it is used) | 3,933 |

What it covers:
- searchable list with skeletons, empty state, error and retry, and refresh errors that keep rows visible
- detail screen with a pending RSVP and `AlertDialog`-confirmed cancellation
- RSVP state persisted with `expo-sqlite` and versioned and validated
- create form with zod validation (3–80 character title, ISO date not in the past, description of 500 characters or fewer)
- a mock API with 300–800 ms latency and switchable failure
- route-level error recovery
- light and dark themes, including the native header

**Verified (2026-11-16):** `tsc --noEmit` passes (TypeScript 6.0.3), and `expo export` builds both the Android and iOS Hermes bundles. **Not verified:** any device, simulator or screen-reader run.
