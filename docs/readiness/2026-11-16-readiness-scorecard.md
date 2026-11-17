# Readiness scorecard (2026-11-16)

**Scale:** 0 = absent, 1 = sketched, 2 = works in a happy path, 3 = tested and used successfully by an independent agent, 4 = verified on target platforms, 5 = production-proven. Each score cites evidence; nothing is scored on intent.

| Dimension | Score | Evidence | Main gap |
|---|---|---|---|
| Architectural completeness | **3** | Every lifecycle stage has tested tooling (`docs/architecture/agent-lifecycle.md`). Independent agents used every stage in benchmark runs 3–4. | Clean-clone CI now gates every PR (PR #5). Planner and engine are still two modules. |
| Construction capability | **3** | 7 construction modules (17 logic tests). 3 typechecked screen recipes. The Block Party example rebuilds from source, passes tsc and builds Android and iOS bundles. All benchmark apps meet the definition of done. | No real auth provider adapter, offline sync, push notifications, deep links, media upload or i18n. |
| Component quality | **3** | 55 components. 0 runtime errors across 55 pages in Chromium. The library typechecks against real RN types. Tap targets are 44 pt or more (2 documented exceptions). Five functional Lab journeys pass with real browser clicks. Maturity labels are honest (all `preview`). | Behaviour tests are still mocked; no device evidence. |
| Agent effectiveness | **3** | Fast path vs plain Claude on the same spec: tokens +15%, tool calls −47%, wall time −54%, app code −75%, with all builds independently re-verified (`docs/benchmarks/`). v1.0 had been worse than no factory on every measure. | n = 1 per arm and one spec. Tokens aren't yet below plain. The blueprint path costs ~49k extra tokens. |
| Native verification | **0** | No component, module or app has run on an iOS or Android device or simulator. 18 `verified` claims are unsupported (R2). | Everything at level 4 depends on this. |
| Enterprise security and operations | **1** | The installer keeps a hash manifest and never overwrites app edits. Source documents are SHA-256 archived. The env module rejects non-public keys. Clean-clone CI on every PR. | No dependency or licence audit, no release pipeline (EAS), crash reporting is only a hook, public repo with no branch protection observed. |

## Next highest-value work (ranked by the deficiency it removes)

1. **A device verification lane** (removes the 0). Run an EAS development build of the Block Party example plus a Lab build on one iOS simulator and one Android emulator. Record `evidence` entries in `contracts.json` (the format is defined in `CONTRACT.md`). This is the only path to `verified`.
2. **Extend CI** (base gate done in PR #5). Add the example build (`examples/build-example.mjs`, then tsc and export) and the browser probe as jobs.
3. ~~Unsupported claims and R4/R5/R7.~~ Done 2026-11-17; Q1–Q3 are permanent guards.
4. **Two more demonstration apps** on the fast path, covering a dashboard (MetricSpotlight, StatusTracker) and a booking flow (SchedulePicker, AlertDialog). Build them from the catalog with the example builder, completing the three-app milestone.
5. **A real auth adapter** (one provider) behind the `AuthAdapter` contract, with a sign-in recipe.
6. **Repeat the benchmark (n ≥ 3 per arm)** with a non-pnpm-quirk environment and a second spec, to turn single-run signals into estimates.

## Handoff (2026-11-17): what remains

All agent work is merged. CI passes on `main`. There are no open PRs and no `todo` checks.

1. **Native verification. This needs a machine with a simulator, emulator or phone; there is none in this WSL environment.**
   ```bash
   cd apps/lab && npx expo start            # press a (Android emulator) or i (iOS simulator), or scan with Expo Go
   node examples/build-example.mjs block-party /tmp/demo && cd /tmp/demo/block-party \
     && pnpm install && npm_config_save=true npx expo install expo-secure-store expo-sqlite zod && npx expo start
   ```
   - **Walk through:** the five journeys from `apps/lab/demos/README.md`, with VoiceOver or TalkBack, at 200% text size, in dark mode and with the keyboard open.
   - **Record results** as `evidence` entries in `packages/catalog/contracts.json` (format in `CONTRACT.md`). Maturity rises automatically only when iOS **and** Android evidence pass.
2. **Repeat the benchmark:** at least 3 runs per arm on a second, unseen spec (`bench/score.mjs`). The current figures are n = 1.
3. **Standalone demo apps:** turn the five Lab demos into apps with `examples/build-example.mjs`, as was done for Block Party.
4. **Visual refinement cycle:** use rendered screenshots (`bench/demo-journeys.mjs` writes end-state screenshots for every journey) as the review surface.
