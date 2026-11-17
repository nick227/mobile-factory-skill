# Component and screen quality

Load this reference when reviewing a screen or component, or deciding what may be claimed in a handoff.
Release evidence rules are in `references/native-quality.md`; maturity levels in `references/catalog-contract.md`.

## Review checklist (per screen)

- **Types:** strict TypeScript, no `any` at feature boundaries; data parsed with the feature's zod schema.
- **States:** loading (skeleton on first load only), error (user message + Retry), empty (with the primary action),
  saving/pending (button `loading`, repeat taps ignored), success (return to the updated view).
- **Accessibility:** roles and labels on every interactive element; 44pt (iOS) / 48dp (Android) touch targets;
  works with large text; screen-reader order follows visual order.
- **Layout:** safe areas respected; the keyboard never covers inputs or the primary action; media has a fixed
  aspect ratio; no reflow when images load.
- **Appearance:** light and dark both readable; semantic theme tokens, no hard-coded colours.
- **Performance:** lists use `FlatList` keyed by record id; no whole-screen remount on refresh.
- **Platforms:** behaviour checked on both iOS and Android before any quality claim.

## What may be claimed

| Evidence you have | You may say |
|---|---|
| `tsc --noEmit` passed | "Typechecks" |
| `expo export` succeeded | "Bundles for <platform>" |
| Node/mocked tests passed | "Logic tests pass (mocked)" |
| Ran on a simulator/emulator/device with platform + OS version | "Checked on <platform OS version>: <what>" |
| Nothing above | "Not verified" |

The shipped catalog marks most components `implemented` or `tested` (mocked); none are `verified` until iOS and
Android evidence is recorded. Pass construct-view warnings on to the user rather than hiding them.
