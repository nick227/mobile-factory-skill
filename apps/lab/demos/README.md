# Lab demo behaviour

Each Lab scenario renders factory components. Its **behaviour** lives here, separate from the reusable UI:

| Demo | Journey | Model |
|---|---|---|
| `event-discovery` | Search/filter → event detail → date, slot and guests → paid booking → confirmation → cancel | `reducer`, `visibleEvents`, `seatsLeft`, `canConfirm` |
| `onboarding` | Validated profile → discipline → plan → review with edit → activation | `reducer`, `fieldErrors`, `maxReachable` |
| `dashboard` | Log hours → milestone details → complete milestone (metrics, stats and roadmap stay in sync) | `reducer`, `totalHours`, `progress` |
| `marketplace` | Filter → product quantity → bag edits within stock → validated checkout → order | `reducer`, `lines`, `total`, `checkoutErrors` |
| `timeline` | Feed links → checklist → one-time sign-off → calendar agenda (one shared dataset) | `reducer`, `marks`, `agenda` |

- **Fixtures** (`fixtures.ts`) are deterministic: no clock, randomness or network. Money is integer cents.
- **Models** (`model.ts`) are pure reducers and selectors. Scenarios only dispatch and render.
- **Journey tests:** `tests/demos/*.test.ts` run in `pnpm check`. They play complete journeys against the models and were mutation-checked.
- **Browser journeys:** `bench/demo-journeys.mjs` clicks through all five journeys in headless Chromium on the web export of the Lab. `bench/dead-controls.mjs` clicks every first-screen control. These are **web** evidence; no native device has been used.
