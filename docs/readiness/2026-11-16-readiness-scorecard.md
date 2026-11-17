# Readiness scorecard (2026-11-16)

**Scale:** 0 = absent, 1 = sketched, 2 = works in a happy path, 3 = tested and used successfully by an independent agent, 4 = verified on target platforms, 5 = production-proven. Each score cites evidence; nothing is scored on intent.

| Dimension | Score | Evidence | Main gap |
|---|---|---|---|
| Architectural completeness | **3** | Every lifecycle stage has tested tooling (`docs/architecture/agent-lifecycle.md`). Independent agents used every stage in benchmark runs 3–4. | `pnpm check` fails from a clean clone (R1); no CI. |
| Construction capability | **3** | 7 construction modules (17 logic tests). 3 typechecked screen recipes. The Block Party example rebuilds from source, passes tsc and builds Android and iOS bundles. All benchmark apps meet the definition of done. | No real auth provider adapter, offline sync, push notifications, deep links, media upload or i18n. |
| Component quality | **2** | 50 components. 0 runtime errors across 50 pages × 2 colour schemes in Chromium. Typechecks clean against real RN types. Behaviour tests are mocked. | Hit areas under 44 px (R7), invalid dialog role (R5), library typechecked against mocks (R4). |
| Agent effectiveness | **3** | Fast path vs plain Claude on the same spec: tokens +15%, tool calls −47%, wall time −54%, app code −75%, with all builds independently re-verified (`docs/benchmarks/`). v1.0 had been worse than no factory on every measure. | n = 1 per arm and one spec. Tokens aren't yet below plain. The blueprint path costs ~49k extra tokens. |
| Native verification | **0** | No component, module or app has run on an iOS or Android device or simulator. 18 `verified` claims are unsupported (R2). | Everything at level 4 depends on this. |
| Enterprise security and operations | **1** | The installer keeps a hash manifest and never overwrites app edits. Source documents are SHA-256 archived. The env module rejects non-public keys. | No CI, no dependency or licence audit, no release pipeline (EAS), crash reporting is only a hook, public repo with no branch protection observed. |

## Next highest-value work (ranked by the deficiency it removes)

1. **A device verification lane** (removes the 0). Run an EAS development build of the Block Party example plus a Lab build on one iOS simulator and one Android emulator. Record `evidence` entries in `contracts.json` (the format is defined in `CONTRACT.md`). This is the only path to `verified`.
2. **CI from a clean clone** (fixes R1). Run `pnpm install --frozen-lockfile && pnpm check && pnpm --filter @factory/foundations test`, plus the example build. Owner: UI foundation for `pnpm check`, agent intelligence for the example and modules.
3. **Set the 18 `verified` claims back to `preview`** (R2), and fix R4, R5 and R7. Owner: UI foundation. The regression checks already exist (Q1–Q3).
4. **Two more demonstration apps** on the fast path, covering a dashboard (MetricSpotlight, StatusTracker) and a booking flow (SchedulePicker, AlertDialog). Build them from the catalog with the example builder, completing the three-app milestone.
5. **A real auth adapter** (one provider) behind the `AuthAdapter` contract, with a sign-in recipe.
6. **Repeat the benchmark (n ≥ 3 per arm)** with a non-pnpm-quirk environment and a second spec, to turn single-run signals into estimates.
