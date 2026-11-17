# Independent quality review: UI foundation (origin/main @ 8fea2a6, local MR 11 @ 56e541f)

**Reviewer:** agent-intelligence workstream (Claude). Antigravity's files were not modified. Everything below was found in a **snapshot copy** of the working tree or a **pristine checkout** of `origin/main`.
**Evidence levels:** *clean-checkout*, *real-types*, *browser* (react-native-web in headless Chromium 390×844 @2x, light and dark) and *static*. **No iOS or Android device or simulator was used.**

## Summary

| # | Finding | Severity | Evidence | Regression check |
|---|---|---|---|---|
| R1 | `pnpm check` fails on a clean clone of `origin/main`: the Lab typecheck reports 127 errors (React types don't resolve). It passes only in a working tree with leftover `node_modules`. | High | clean-checkout | **Fixed** in PR #5 (`@types/react` declared in `@factory/ui`); enforced by `.github/workflows/check.yml` |
| R2 | 18 components are `verified` (all premium widgets, Dialog, AlertDialog, Select, Tabs, Accordion, Portal) with no recorded device evidence. The shared quality gate forbids this. | High | static (catalog contract) | **Fixed 2026-11-17**: all 23 claims (count grew after MR 13–16) set to `preview`; Q1 is now a guard |
| R3 | The built skill shipped **none** of those 18 components in `catalog.json`, because `build-skill` kept only `stable`/`preview`. Their source shipped, but agents could not discover the product's differentiators. | High | clean-checkout | **Fixed** in `claude/construction-foundations` (`catalog-contract.test.mjs`) |
| R4 | `packages/ui/tsconfig.json` extends `tsconfig.base.json`, which maps `react-native`, `expo-image` and `react-native-safe-area-context` to **hand-written test mocks**. The library is typechecked against fake types. | Medium | static | **Fixed 2026-11-17**: mock mappings moved to the root test `tsconfig.json`; `packages/ui` typechecks clean against real types; Q3 is now a guard |
| R5 | `Dialog` uses `accessibilityRole="dialog"`. That is not an RN `AccessibilityRole` (the valid prop is `role="dialog"`). RN 0.88's types accept any string here, so neither `tsc` nor the mocked tests can catch it. On native, an unrecognised role is dropped; the dialog announcement is unverified. | Medium | real-types + static | **Fixed 2026-11-17**: `role="dialog"` plus `accessibilityViewIsModal`; Q2 is now a guard |
| R6 | Locked decision 2 (headless primitives for overlays) isn't followed. Dialog, AlertDialog and Select use RN `Modal`, and `primitives.portal` is a separate 133-line custom portal that Dialog doesn't use. This isn't necessarily worse (zero dependencies, and Android back works via `onRequestClose`), but it's an unrecorded deviation. | Low (process) | static | Record the decision in `standards/` |
| R7 | Rendered hit areas under 44 px: SchedulePicker period filters are 29 px tall (four chips), the ImmersiveHero back button ("Guides") is 89×28, and the Toggle switch is 40×20 (web Switch; native sizes differ). | Medium | browser | **Fixed 2026-11-17**: compact `Button` raised to 44 pt, which fixed SelectionDock, ProductShowcase and timeline actions; SchedulePicker chips and the hero back control set to 44 minimum. Accepted exceptions: Toggle (web render of a native Switch) and calendar day cells (41 px wide, seven columns at 390 px). |
| R8 | UI behaviour tests (60) run against `tests/mocks/react-native.js`, where every RN component is a plain element. They check prop passing, not layout, gestures, keyboard or accessibility behaviour. | Info | static | Q4 keeps mocked tests from ever counting as `verified` |

## Positive evidence

- **No runtime errors in the browser.** All 50 Lab component pages rendered in Chromium with **0 page errors and 0 console errors**, in both light and dark colour schemes, and no showcase was missing.
- **The library typechecks against real types.** With the real RN 0.88, expo-image and SDK 58 types, `packages/ui/src` has **0 errors**. Only R5 slips through, because RN's role typing is loose.
- **Engine compatibility.** Antigravity's `factory-v1/engine.mjs` changes (merge-by-id updates and task preservation) are compatible with the planner. My full suite passes on top of `origin/main`.
- **Installer.** `install-source.mjs` now computes a dependency closure for selective installs.

## Reproduction

```bash
# R1 (clean clone)
git worktree add --detach /tmp/pristine origin/main && cd /tmp/pristine
corepack pnpm install --frozen-lockfile
corepack pnpm exec tsc --noEmit -p apps/lab/tsconfig.json   # 127 errors, exit 2

# R2/R4/R5 (any checkout with this branch)
node --test tests/quality-regressions.test.mjs              # Q1–Q3 reported as TODO
node scripts/factory.mjs catalog get composites.dialog --role construct   # shows claimUnsupported warning

# R7 (browser)
cd apps/lab && npx expo export --platform web --output-dir /tmp/lab-web
node bench/browser-probe.mjs /tmp/lab-web packages/catalog/registry.json /tmp/probe   # needs playwright-core and Chromium
```

## Recommended owner actions (UI foundation)

1. ~~Add a clean-clone CI job (R1).~~ Done in PR #5. Keep it required on `main`.
2. Set the 18 `verified` records back to `preview`, or record device evidence in `packages/catalog/contracts.json#items.<id>.evidence` (R2). The contract computes maturity, so it never has to be hand-edited again.
3. Move the mock path mappings into `tsconfig.test.json` (R4). Change Dialog to `role="dialog"` (R5).
4. Raise the SchedulePicker chips and the ImmersiveHero back button to a 44 pt minimum (R7). Make the whole Toggle row pressable.
5. Write down the overlay implementation decision (R6).
