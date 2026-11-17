# Does the factory save agent time and tokens? (2026-11-16)

**Task:** the same approved spec (`bench/spec/neighborhood-events.md`): 3 screens, a mock API, persistence, validation, error recovery, accessibility and dark mode. **Agent:** an independent Claude subagent per arm (same model). Each arm got the same prompt apart from the tooling clause. **Scoring:** `bench/score.mjs` re-runs `tsc` and the Android export itself and measures code volume. Raw data is in `bench/results/`.

## Results (n = 1 per arm)

| Arm | Tokens¹ | Tool calls | Wall time | App-authored lines² | Recipe lines³ | Factory modules / UI parts used | tsc / Android (re-run) | Static spec checks⁴ |
|---|---|---|---|---|---|---|---|---|
| Plain Claude, no factory | 75,082 | 34 | 8.0 min | 983 | — | — / — | pass / pass | 15/15 |
| Factory v1.0 (as shipped) | 124,524 | 39 | 9.9 min | 676 | — | 0 / 15 | pass / pass | 15/15 |
| Improved factory, blueprint path | 135,540 | 39 | 6.9 min | 300 | 146 | 4 / 17 | pass / pass | 15/15 |
| **Improved factory, fast path** | **86,317** | **18** | **3.7 min** | **250** | 96 (unchanged) | 5 / 17 | pass / pass | 15/15 |

Fast path compared with plain Claude: **tokens +15%, tool calls −47%, wall time −54%, app-authored code −75%.**

¹ This is the subagent's total token count from the harness. The input/output split, cache hits and dollar cost are **not available**.
² Non-blank, non-comment TS/TSX excluding `src/ui`, `src/foundations` and `src/recipes`.
³ Factory recipes copied into the app. Arm 3 edited them; arm 4 used them unchanged.
⁴ Source-pattern heuristics (routes, persistence, confirmation, validation rules, latency, dark mode, aspect ratio). These are **not** behavioural tests. No arm was run on a device, simulator or browser.

## What the numbers say

1. **The factory's value is less code and less time, not fewer tokens.** Every factory arm wrote 31–75% less app code. The fast path finished in under half the time of plain Claude. Tokens only fell to near parity (+15%) once the ceremony was removed.
2. **The planning ceremony was the token cost.** The improved factory on the blueprint path spent about 49k more tokens and 21 more tool calls than the fast path on the same pre-approved spec: interview, blueprint, and nine `plan done` calls. Keep the blueprint for discovery, approval and multi-session work. SKILL.md now routes small pre-approved apps to the fast path.
3. **v1.0 was worse than no factory on every efficiency measure.** Its friction log shows why: names-only search meant reading every component file, a wrong import path, and approval resets.
4. **Self-reported rework fell.** Plain fixed one type error. v1.0 drifted from its blueprint to avoid approval resets. The blueprint arm fixed one type error and deleted a broken module file. On the fast path the first typecheck passed.

## Workflows simplified because of these runs

| Run | Friction observed | Change |
|---|---|---|
| v1.0 | Read every source file; wrong import; approval wipes tasks | Catalog contract and role views; `@/src/ui` alias; selective invalidation |
| Blueprint | Recipe IDs failed audit; "no backend" chose env; `ProtectedLayout` broke tsc; lite default contradicted facts; visual review silently "done"; recipe gaps; stale template | All fixed, with regression tests (commit "Fix defects found by benchmark run 3") |
| Blueprint | About half of its tool calls were ceremony | Fast path |
| Fast path | `module recommend` needed a project; `--help`; dialog closed before save finished | Fixed (commit "Fix defects found by benchmark run 4") |
| All | `~/.npmrc save=false` stopped `expo install` writing package.json | Documented workaround in SKILL.md (environment issue, not a factory issue) |

## Confounds and limits

- **n = 1 per arm.** Treat the differences as signals, not estimates. Run-to-run variance is unknown.
- **Arm 4's prompt differs from arms 2–3** in one clause: "follow SKILL.md's path guidance" instead of "use the blueprint/plan CLI".
- **pnpm vs npm.** Arms were told to add an empty `pnpm-workspace.yaml` if they used pnpm. The plain arm used npm and avoided some pnpm and `save=false` friction that the factory arms hit.
- **Same spec author.** The spec was written by the same workstream that built the improvements, which risks fitting to one app. A second, unseen spec is the next benchmark.
- **Not measured:** runtime correctness, accessibility in use, visual quality, cost in dollars, and long-term maintainability beyond code volume and reuse of tested modules.
