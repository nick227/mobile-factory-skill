# Benchmark app spec: "Block Party" (neighborhood events)

The product owner has already approved this spec. Don't ask clarifying questions: where something is ambiguous, make a reasonable choice and record it in REPORT.md.

## Platform
- Expo SDK 58, React Native 0.88, Expo Router, strict TypeScript, iOS and Android.
- No backend. Use an in-app **mock API module** with simulated latency (300–800 ms) and a way to force errors, so loading and error states can be exercised.

## Screens
1. **Events list** (`/`)
   - Lists upcoming events: title, date, venue and a cover image with a fixed aspect ratio.
   - A search field filters by title or venue.
   - It has loading, empty, error and retry states.
   - Tapping an event opens its detail screen.
2. **Event detail** (`/events/[id]`)
   - Shows the cover image, title, date, venue, description and the RSVP count.
   - An "RSVP" button toggles attendance and shows a pending state while it saves.
   - Cancelling an existing RSVP needs an explicit confirmation step, because it's destructive.
   - It has loading and error states.
3. **Create event** (`/events/new`)
   - A form for title (required, 3–80 chars), date (required, ISO `YYYY-MM-DD`, not in the past), venue (required) and description (optional, ≤ 500 chars).
   - Validation messages appear inline. Submit is disabled while saving.
   - On success it returns to the list and the new event is visible there.
   - It's reached from the list screen.

## Behaviour
- RSVP state **persists locally** across app restarts, using device storage.
- A render error on any screen shows a recoverable error screen, not a crash.
- Every interactive element has an accessibility role and label. Touch targets are at least 44 pt.
- Light and dark mode both work.

## Definition of done (all arms)
- `npx tsc --noEmit` passes.
- `npx expo export --platform android` succeeds.
- `REPORT.md` in the app root lists:
  - what you built
  - decisions you made
  - what you verified, using **only commands you actually ran**
  - what you did **not** verify

  Don't claim device testing, because none is available.
