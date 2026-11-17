# Block Party — REPORT

## What I built

An Expo SDK 58 / React Native 0.88.1 app using Expo Router and strict TypeScript, with three routes under `src/app/`:

- **Events list (`/`, `src/app/index.tsx`)**: upcoming events (date today or later, sorted by date), each shown as a card with a 16:9 cover image, title, date and venue. A search field filters by title or venue (case-insensitive). It has loading, error (with "Try again"), empty ("No upcoming events" with a create action) and no-search-results ("Clear search") states, plus pull-to-refresh. If a refresh fails while data is already showing, a retry banner appears. A "+ New" button opens the create screen. Tapping a card opens its detail screen.
- **Event detail (`/events/[id]`, `src/app/events/[id].tsx`)**: cover image, title, date, venue, description and RSVP count. The RSVP button shows a spinner and "Saving…" while the request is pending and is disabled during that time. Cancelling an existing RSVP opens a confirmation `Alert` with "Keep RSVP" and a destructive "Cancel RSVP" option. It has loading and error/retry states, and RSVP save errors appear inline.
- **Create event (`/events/new`, `src/app/events/new.tsx`)**: a modal form with title (required, 3–80 chars), date (required, strict `YYYY-MM-DD`, must be a real calendar date, not before today), venue (required) and description (optional, ≤ 500 chars, with a live counter). Errors appear inline under each field after you leave it or try to submit. The submit and cancel buttons and the inputs are disabled while saving. On success it calls `router.back()`. The list reloads on focus, so the new event shows up there.

Supporting modules:
- `src/api/mockApi.ts`: an in-memory mock API with 300–800 ms of random latency and a switchable failure mode (`off`, `random` with about 30% failures, `always`). It exposes `listEvents`, `getEvent`, `setRsvp` and `createEvent`.
- `src/components/FailureModeToggle.tsx`: a header button on the list screen that cycles the failure mode, so loading and error states can be exercised.
- `src/components/RouteErrorBoundary.tsx`: re-exported as `ErrorBoundary` from the root layout and from every route. Expo Router shows it in place of a screen that throws during render, and its "Reload screen" button calls `retry()`.
- `src/theme/colors.ts`: light and dark palettes picked with `useColorScheme()`, also passed to the navigation theme. `app.json` sets `userInterfaceStyle: "automatic"`.
- `src/lib/date.ts`, `src/lib/validation.ts`: date helpers and form validation.
- `src/components/*`: Button, FormField, EventCard, CoverImage and the loading/error/empty state views.

Libraries added (all via `npx expo install` for SDK-compatible versions): `expo-router`, `react-native-screens`, `react-native-safe-area-context`, `expo-linking`, `expo-constants`, `expo-image`, `@react-native-async-storage/async-storage`, `react-dom` (an expo-router peer dependency, needed to resolve the npm lockfile).

## Decisions

- **Package manager**: npm. There is no pnpm project, so no `pnpm-workspace.yaml`. The global npm config has `save=false`, so I ran `npm install --save=true` once to write `package-lock.json`.
- **RSVP persistence**: the set of RSVP'd event IDs is stored in AsyncStorage (`blockparty:rsvps:v1`). The RSVP count is the event's base count plus 1 if you are attending.
- **Created events are not persisted**: they live in mock-API memory for the session only. The spec only requires RSVP state to persist.
- **Seed data**: dates are relative to today (+3 to +20 days), so the seed events always count as "upcoming".
- **Cover images**: remote `picsum.photos` URLs seeded per event, shown in a fixed 16:9 frame with a placeholder background, via `expo-image`. They need network access; without it you see the placeholder colour.
- **"Not in the past"**: compared against the device's local date. Today is allowed.
- **Destructive confirmation**: uses the native `Alert` dialog. Making a new RSVP needs no confirmation.
- **Validation timing**: a field's error shows after it loses focus or after you try to submit. That avoids errors flashing while you type.
- **Error simulation**: a header toggle on the list screen, not an environment flag, so it can be used at runtime. The setting is global, so it also affects the detail and create screens.
- **Accessibility**: every Pressable has `accessibilityRole` and `accessibilityLabel`. Every TextInput has an `accessibilityLabel`, plus a role where React Native has a fitting one (the search field uses `search`). Buttons, chips and inputs have `minHeight`/`minWidth` of 44, and event cards are much taller. Errors use `accessibilityRole="alert"`.
- **Create screen** is presented as a modal stack screen.

## What I verified (commands actually run)

- `npx tsc --noEmit`: passed (exit 0) on the final code. An earlier run found a `ListHeaderComponent` type error, which I fixed.
- `npx expo export --platform android --output-dir /home/administrator/web/cmf-bench/runs/plain-1/export`: succeeded (exit 0) and produced one Android Hermes bundle (`entry-*.hbc`, about 2.5 MB).
- `npx expo-doctor`: 20/20 checks passed after the lockfile was generated. The first run failed only the "lock file" check.
- `npx tsx <scratch script>`: ran `validateEvent` against these cases, and each gave the expected result: valid input, a 2-char title, an 81-char title, yesterday's date, the malformed date `2026-2-1`, the impossible date `2027-02-30`, a blank venue and a 501-char description.

## What I did NOT verify

- I ran nothing on an iOS or Android device, emulator, simulator, Expo Go or the web, so none of the runtime behaviour has been observed: rendering, navigation, the loading/error/empty states, the RSVP pending state and confirmation dialog, AsyncStorage persistence across restarts, the error boundary recovery, dark mode appearance, keyboard behaviour or image loading.
- No screen reader (VoiceOver/TalkBack) testing, and no measurement of real touch-target sizes.
- No automated component or unit tests are included in the project. The validation check above was a one-off script.
- No iOS export or build, and no native (`expo run`/EAS) build.
