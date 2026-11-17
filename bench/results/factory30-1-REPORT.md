# Block Party — build report

## What I built
An Expo SDK 58 / React Native 0.88 / Expo Router app in strict TypeScript, built from the Mobile Software Factory (fast path: template, source installer, modules and recipes).

- **Events list (`/`)** — `app/index.tsx` uses the factory `recipe.collection-screen`. Each row shows the title, the date, the venue and a 4:3 cover in a fixed-ratio `MediaFrame`. Search filters by title or venue as you type. The screen has skeleton loading, empty states ("Nothing here yet" with a create action, or "No matches"), an error state with Retry, and a refresh error that keeps the existing rows visible. Tapping a row opens the detail screen. A "New event" button opens the create form. In development builds, a "Simulate network errors" toggle forces every mock API call to fail.
- **Event detail (`/events/[id]`)** — `app/events/[id].tsx` uses `recipe.detail-screen`. It shows the 16:9 cover, title, date, venue, description, RSVP count and a "You're going" badge. The RSVP button is pinned in an `ActionDock` and shows a spinner while saving. "Cancel RSVP" asks for confirmation in the factory `AlertDialog` before doing anything. The screen has loading (skeleton) and error-with-Retry states, and a missing event shows "This item no longer exists."
- **Create event (`/events/new`)** — `app/events/new.tsx` uses `recipe.form-screen` with zod rules from `module.validation`: title 3–80 characters, date in `YYYY-MM-DD` form that is a real date and not in the past, venue required, description optional and at most 500 characters. Inline errors appear after the first submit attempt. Submit shows a spinner and is disabled while saving, and a save failure shows an inline message. On success the screen calls `router.back()`. The list reloads when it regains focus, so the new event appears there.
- **Mock API** — `src/features/events/mock.ts` and `api.ts` use `module.api-client` (`createMockTransport`) with 300–800 ms of random latency and `mock.setFailure('always' | 'sometimes' | 'never')`. Responses are parsed with zod schemas (`schema.ts`).
- **RSVP persistence** — `src/features/events/store.ts` and `useRsvp.ts` use `module.persistence`: a versioned, validated store backed by the expo-sqlite kv-store. After the mock API confirms an RSVP change, the RSVP map is written to device storage.
- **Render-error recovery** — `app/_layout.tsx` exports `RouteErrorBoundary` from `module.error-boundary` as `ErrorBoundary`, so a render error on any route shows a "This screen hit a problem / Try again" screen.
- **Theming** — `ThemeProvider mode={null}` follows the system scheme and `app.json` sets `userInterfaceStyle: automatic`. The native header and screen background follow the theme through `useStackTheme()` from `module.navigation`.

## Decisions
- **Factory path:** I used the fast path that SKILL.md describes for a small app with an approved spec. I skipped the blueprint, plan and interview commands.
- **RSVP count:** the mock event's `rsvpCount` counts other attendees only. The count shown is `rsvpCount + (I'm attending ? 1 : 0)`, and whether I'm attending comes from device storage. This keeps the count consistent after a restart, when the in-memory mock has reset.
- **RSVP write order:** the API is called first and local storage is updated only if it succeeds. On failure the stored state is unchanged and an inline error appears above the button. The UI is not updated optimistically.
- **Cancel confirmation:** I kept the recipe's behaviour. The dialog closes on confirm and the button shows the pending state. The `AlertDialog` catalog entry suggests keeping the dialog open while loading; the recipe does it differently, and I followed the recipe.
- **Mock data is in memory:** created events and other attendees' counts reset when the app restarts. Only the user's own RSVPs persist, which is what the spec asks for. Seed event dates are relative to today, so they always count as upcoming. The list shows only events dated today or later, sorted by date.
- **Search is client-side** over the loaded list, so typing doesn't trigger network calls.
- **Retries:** the API client uses `retries: 0`, so forced errors show up immediately instead of after a back-off.
- **Error toggle visibility:** the toggle that forces errors appears only in development (`__DEV__`). Code can also call `mock.setFailure(...)`.
- **Create screen presentation:** it uses `presentation: 'modal'`. Its title and dismiss control come from the router header, as the form recipe expects.
- **New events have no cover image.** `MediaFrame` reserves the frame and shows its surface-coloured placeholder.
- **Seed covers** are `picsum.photos` URLs, so they need network access. If an image fails to load, `MediaFrame` falls back to the empty frame at the same size.
- **Dates** are entered as ISO text with a numeric keyboard. The spec asks for ISO `YYYY-MM-DD`, and no date-picker dependency was added. "Not in the past" is checked against the device's local calendar date.

## What I verified (commands actually run)
- `npx tsc --noEmit` passed with exit code 0 and no errors.
- `npx expo export --platform android --output-dir /home/administrator/web/cmf-bench/runs/factory30-1/export` exited 0 and produced one Android Hermes bundle, `_expo/static/js/android/entry-*.hbc` (3.4 MB).
- `npx expo install --check` reported "Dependencies are up to date".

## What I did NOT verify
- No device, simulator, emulator or browser testing on iOS or Android. None was available, so I didn't launch the app at all.
- I didn't check at runtime that RSVPs survive an app restart, that the error boundary recovers, that light and dark mode render correctly, that screen readers announce things properly, that touch targets measure at least 44 pt on a device, or that the keyboard avoids the form fields. These rely on the code and on the factory components' declared sizes (`Button` 48, `ListItem` 56, `TextField` 48, `Toggle` 48), and none of it was observed running.
- There are no automated unit or UI tests in this app, and I ran none.
- I didn't check that the remote `picsum.photos` images load.

## Factory friction
- **Helped:**
  - `catalog search` found every part I needed in one pass: the collection, detail and form recipes, `AlertDialog`, `MediaFrame`, and the persistence, api-client and validation modules.
  - `catalog get --role construct` gave complete recipe code and props, so I didn't need to read library source.
  - The modules matched the spec almost exactly. The mock transport already has latency and failure modes, `useResource`/`useMutation` already guard against repeated taps, and `isoDateNotPast`/`requiredText`/`optionalText` cover the form rules.
  - The first typecheck passed with no errors.
- **CLI/docs mismatch:**
  - SKILL.md says the fast path skips the blueprint and that `module add` doesn't need a project.
  - But step 3 still says to run `module recommend --project <app>`, which fails with `{"error":"No project: run project init first"}`.
  - On the fast path, modules have to be chosen by hand from `references/foundations.md`, which does work.
- **`npx expo install` didn't save to package.json:**
  - On the first run it reported adding the packages but `package.json` didn't change, because npm config has `save=false`.
  - SKILL.md documents this, and re-running with `npm_config_save=true` fixed it. It's still a trap every run hits.
- **CLI help:** `node scripts/factory.mjs --help` returns "Unknown command". Only `help` without dashes works.
- **Recipe vs component guidance conflict:** the `AlertDialog` constraint says to keep the dialog open with loading until the action settles, but `recipe.detail-screen` closes it immediately.
- **Navigation module shape:**
  - `RootLayout.tsx` has to be copied to `app/_layout.tsx`, but it hard-codes `<Stack screenOptions=… />` with no per-route options.
  - To set titles or modal presentation I rewrote the layout and imported `useStackTheme` from the module file.
  - The rule "Import Expo Router's `Stack` in `app/_layout.tsx`; import the UI `Stack` in screens" leaves out `Stack.Screen` options inside a screen. I imported Expo Router's `Stack` as `RouterStack` in the detail screen to set a dynamic title.
- **SafeAreaProvider warning:** the catalog says "App must mount: SafeAreaProvider", but neither the template nor the navigation module mounts it explicitly. I relied on Expo Router providing it, and I didn't verify that on a device.
- **Template leftovers:**
  - The template `package.json`, `app.json` name/slug/scheme and README are generic, so I renamed them by hand.
  - `pnpm install` warns about a react-dom 19.3.1 peer mismatch with the pinned react 19.3.0.
- **Missing:**
  - There's no date-picker control in the catalog, so the date field is plain text input.
  - There's no list-row pattern with a larger card-style cover, so I used the recipe's 72 px thumbnail row.
  - `module recommend` can't run without a blueprint, so the fast path has no automated module selection.
- **AlertDialog maturity:** its catalog entry warns "Registry claims 'verified' without supporting evidence; treat as 'implemented'". That was useful honesty, but it means the registry and the computed maturity disagree.
