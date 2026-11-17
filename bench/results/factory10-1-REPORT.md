# Block Party — build report

## What I built

An Expo SDK 58 / React Native 0.88.1 / Expo Router app (strict TypeScript) with three routes:

| Route | File | What it does |
|---|---|---|
| `/` | `app/index.tsx` → `src/features/events/EventsListScreen.tsx` | Upcoming events (past events filtered out, sorted by date). Each row shows title, date, venue and a 16:9 cover in a fixed-ratio `MediaFrame`. Search field filters by title or venue. States: skeleton loading, error + Retry, empty ("No upcoming events" + Create), no search results (+ Clear search), and a non-destructive "Couldn't refresh" banner + retry when a background refresh fails while data is shown. "New event" button opens the create form. A "Simulate network errors" toggle forces all mock API calls to fail. |
| `/events/[id]` | `app/events/[id].tsx` → `EventDetailScreen.tsx` | Cover, title, date, venue, description, RSVP count, "You're going" badge. RSVP button shows a pending (busy/disabled spinner) state while saving. When attending, the button becomes "Cancel RSVP", which opens an inline confirmation ("Yes, cancel RSVP" / "Keep my RSVP") before anything is saved. States: loading skeleton, error + Retry, not found, RSVP save error. |
| `/events/new` | `app/events/new.tsx` → `CreateEventScreen.tsx` | Modal form: title (required, 3–80 chars after trimming), date (required, strict `YYYY-MM-DD`, a real calendar date, not before today in local time), venue (required), description (optional, ≤ 500 chars, live counter). Inline errors appear after a field blurs or after a submit attempt. The submit button is disabled and shows a spinner while saving, and a ref guard blocks rapid repeat taps. On success it navigates back; the list refetches on focus, so the new event is visible. A save failure is shown inline. |

Supporting modules (`src/features/events/`):
- `api.ts`: in-app mock API. Every call waits 300–800 ms (random) and rejects with `MockApiError` when the failure switch is on (`mockApiControls.setFailRequests`, wired to the list-screen toggle).
- `rsvpStorage.ts`: the set of attended event IDs, persisted with `@react-native-async-storage/async-storage` (key `blockparty.rsvps.v1`).
- `fixtures.ts`: seed events dated relative to today (one past event, which the list excludes). `validation.ts`, `dates.ts`, `search.ts`: pure logic.
- `src/features/shared/RouteErrorScreen.tsx`: a recoverable error screen with "Try again" (calls Expo Router's `retry`). Every route file and the root layout export it as `ErrorBoundary`.

UI is composed from the factory library installed into `src/ui`: `ScreenHeader`, `TextField`, `Button`, `ListItem`, `MediaFrame`, `CalmSkeleton`, `EmptyState`, `Toggle`, `ActionDock`, `Surface`, `Badge`, `Stack`, `Text`, `useTheme`/`geometry` tokens. I wrote no replacement components.

Factory planning state is in `.factory/` (`project.json` at revision 2, approved; docs in `.factory/docs/`; the patch I applied is in `.factory/block-party.patch.json`).

## Decisions

- **Approval:** the spec says the product owner already approved it. I recorded this as a `user-confirmation` decision in the blueprint, citing the spec text as evidence, then ran `blueprint approve`. The `release-readiness` task is user-gated, so I left it open.
- **Navigation:** one native stack with no tabs. The list and create screens hide the native header and use the factory `ScreenHeader`; create is presented as a modal with a "Cancel" back. The detail screen uses the native header, so platform back works and shows the event title.
- **Created events** live in the mock API's in-memory store and disappear on restart. The spec only requires RSVP state to persist, and there is no backend.
- **RSVP count** = the event's base count from other neighbours + 1 if this device is attending.
- **Cancel confirmation** is an inline panel in the action dock rather than `Alert.alert`, so it looks the same on iOS and Android and fits the factory's ActionDock pattern. Confirming uses a danger-coloured primary button.
- **Upcoming** means `date >= today` (local date). Dates are formatted by hand (e.g. "Sat, Nov 21, 2026") to avoid depending on Intl support in the JS engine.
- **Error forcing:** a visible developer toggle on the list screen ("Simulate network errors"). I chose this over a hidden gesture so it has an accessible tap path.
- **Calm loading:** a skeleton appears only on the first list load. Refocus refetches keep the existing list on screen. On the detail screen, the cover-shaped placeholder is an empty `MediaFrame`, so the geometry matches the loaded cover.
- **Covers** are remote `picsum.photos` URLs. If an image fails, `MediaFrame` keeps the fixed-ratio frame and shows an empty surface.
- **Accessibility:** every Button/ListItem/Toggle/TextField gets an explicit `accessibilityLabel`, and buttons get role `button` from the factory component. The search input uses role `search`, the toggle uses `switch`, errors use `alert`, and the detail title uses `header`. Factory controls use 48 pt minimum heights (ListItem 56). The native Switch got an 8 pt `hitSlop` because the switch itself is smaller than 44 pt.
- **Light/dark:** factory `useTheme()` follows the system colour scheme, and `app.json` sets `userInterfaceStyle: automatic`. The navigation theme (native header and stack background) is derived from the factory palette.
- **Dependencies:** `@types/react ~19.3.0` and `typescript ~6.0.3`. The template pinned `~19.2.0` and `~5.9.3`, which `expo install --check` flagged.
- **Typecheck scope:** `scripts/` is excluded from `tsc` because `logic-check.ts` uses Node built-ins and `@types/node` isn't installed. It runs through `tsx`.

## What I verified (commands actually run)

| Command (in app dir unless noted) | Result |
|---|---|
| `node scripts/factory.mjs blueprint audit --project <app>` (skill dir) | `ready: true`, 0 problems |
| `corepack pnpm install` | succeeded (peer warning: `react-dom 19.3.1` wants `react ^19.3.1`, found 19.3.0) |
| `CI=1 npx expo install --check` | "Dependencies are up to date" (after aligning versions) |
| `node scripts/install-source.mjs library catalog.json <app> --all` (skill dir) | "Installed 35 UI source files" |
| `npx tsx scripts/logic-check.ts` | "logic-check: all assertions passed": validation boundaries (title 2/3/80/81 chars, invalid/non-existent/past dates, blank venue, description 500/501), date parsing/formatting, search by title/venue (case-insensitive), fixtures |
| `npx tsc --noEmit` | exit 0 (final run) |
| `npx expo export --platform android --output-dir /home/administrator/web/cmf-bench/runs/factory10-1/export` | exit 0; "Android Bundled … (1191 modules)", one `.hbc` bundle written; I grepped the bundle and found app strings such as "Cancel your RSVP?" |

## What I did NOT verify

- **No device, emulator or simulator testing** of any kind, on iOS or Android. I did not open the app or see it render.
- Not exercised at runtime: loading/empty/error/retry states, navigation between routes, RSVP toggling and pending state, the cancel confirmation, the create flow returning to the list with the new event visible, and the error toggle.
- AsyncStorage persistence across app restarts was not executed. It is implemented, but not tested.
- The `ErrorBoundary` recovery screen was never triggered. Nothing deliberately throws during render.
- Visual review of light and dark mode, contrast, Dynamic Type / large fonts, keyboard overlap and safe areas was not done.
- Touch target sizes were checked only by reading component styles, not measured on a device. Screen-reader behaviour was not tested.
- No iOS export or build, and no native (`expo prebuild`/EAS) build.
- No React Native component tests: the factory ships none to the app, and I added no test runner. `logic-check.ts` covers only pure TypeScript logic.

## Factory friction

**Helped**
- The catalog plus installed source gave me working, typed, themed components (Button busy state, TextField with inline error, MediaFrame with a fixed ratio and failure fallback, ActionDock with safe-area padding, EmptyState, CalmSkeleton). All three screens are composed from them, and nothing needed patching.
- The installed library type-checked cleanly against SDK 58 / RN 0.88 / TS 6 straight away.
- The blueprint audit forced me to state loading/error states and acceptance criteria for each screen up front. `plan task` packages are small.
- The design references (gutter 20, 48 pt targets, stable media ratios, calm loading, destructive confirmation) map straight onto the spec.

**Wrong or misleading docs and CLI**
- `SKILL.md` is titled "Mobile Development Skill v0.6" while `RELEASE.json` says 1.0.0, and the template `package.json` says version 0.6.0.
- `catalog get` returns `usage: "import { X } from '@factory/ui'"` and `absoluteSource: "packages/ui/src/..."`. Neither exists in an app: the installer copies source to `src/ui`, so the import is a relative `../../ui`. The template's own `app/index.tsx` uses `../src/ui`.
- `factory-v1/README.md` documents `pnpm factory …` commands and "Factory's existing 10 governance checks", neither of which exists in the unpacked skill. It also says the CLI reads `packages/catalog/registry.json`; the skill falls back to `catalog.json`.
- The workflow doc says to start with `project status`, but that errors with "No project: run project init first" before `init`.
- The template pins `@types/react ~19.2.0` and `typescript ~5.9.3`. `expo install --check` flags both for SDK 58, which expects `~19.3.0` and `~6.0.3`.
- The template is missing `pnpm-workspace.yaml`, `expo-env.d.ts`, `expo-status-bar`/`expo-linking`/`expo-constants`, and app name/slug placeholders ("Generated Mobile App"). I had to add these by hand.

**Got in the way or missing**
- **`catalog search` matches only id/name/category/status.** There is no description, props or usage summary, so I had to read every TSX file to learn the APIs. `catalog get` doesn't return props either.
- **All 32 components are `preview`, and their tests aren't shipped.** The catalog `test` paths point at files outside the skill.
- **Planning and building are out of order.** `project init` must run before the app directory exists, so `.factory/` is created first and the template is copied into a non-empty directory. Nothing documents this order.
- **Approval rules are rigid.** Any blueprint edit bumps the revision and wipes approval and tasks, so a small component-list correction after approval means re-approving and rebuilding the plan. Because of that, the blueprint's component lists drift slightly from what I used (I also used `ListItem`, `Toggle`, `Surface`).
- **Patch files have no home.** `project update --file` needs a JSON patch on disk, and the CLI has no convention for where to keep it. I stored it in `.factory/`.
- **Generic task plan.** `plan build` creates `module-data` with acceptance "migration and fixture checks" even for a mock-only app. The `verify-*` tasks list "visual review", which can't be met without a device.
- **No evidence validation.** `plan done` accepts any non-empty evidence text. I wrote evidence that explicitly states the gaps rather than claiming visual review.
- **Missing pieces:**
  - no route-level error-boundary component or guidance;
  - no search-field or list-card composite (I combined `ListItem` with a `MediaFrame` thumbnail);
  - no danger/destructive `Button` variant (I used a style override with `colors.danger`) and no confirmation pattern, even though `navigation.md` requires explicit destructive confirmation;
  - no FlatList-aware `Screen` (`Screen` only wraps View/ScrollView);
  - no safe-area-aware top inset in `Screen`/`ScreenHeader`;
  - no data-layer or persistence guidance;
  - the factory `Button` sets no `accessibilityLabel` itself (it relies on the child text), so I passed labels explicitly;
  - the factory `Toggle` passes props to the `Switch`, which has no 44 pt hit area, so I added `hitSlop`.
- **Installer is all-or-nothing.** `install-source.mjs --components` isn't selective (as documented), so all 35 files are installed, including unused `SwipePager`, `RadioGroup` and others.
- **Not the factory's fault, but it cost time:** with an empty `pnpm-workspace.yaml` (required by this exercise), `npx expo install <pkg>` / `pnpm add` updated `pnpm-lock.yaml` and `node_modules` but not `package.json`, and `expo install --fix` was reverted by the next `pnpm add`. I edited `package.json` by hand and re-ran `pnpm install`.
