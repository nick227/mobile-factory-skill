# Segmented UAT: skill orchestration (2026-11-17)

Real, isolated `claude -p` runs (default model, `--setting-sources project`, packaged skill installed as a project skill), one per segment entry. Each run starts from a project state built through the factory API (`bench/segments/fixtures.mjs`) and gets one natural user message. Scoring is deterministic (`bench/segments/run.mjs`): persisted state plus transcript. No device or Expo runs; app dependencies were not installed.

Common checks on every run: the state is valid after the run, the skill is used, the agent orients with `workflow status`, the agent loads the active segment reference, and every chat quote the agent attributes to the user appears in the user message (no invented user words).

| Case | User message | Checks | Segment after | Turns | Cost | Input tok (incl. cache) | Output tok |
|---|---|---|---|---|---|---|---|
| 02-discovery | I want an app so my household stops wasting food that expires in the cupboard. | 8/8 | 02-discovery | 8 | $0.24 | 185,811 | 1,793 |
| 03-requirements | I added our spec (spec.md). Carry on. | 8/8 | 03-requirements | 10 | $0.28 | 198,885 | 2,811 |
| 04-design | Requirements are done. Let's design the screens. | 7/7 | 04-design | 9 | $0.30 | 196,853 | 3,446 |
| 05-blueprint | Looks about right. What do you need from me before building? | 7/7 | 05-blueprint | 7 | $0.21 | 128,359 | 1,654 |
| 06-catalog | Approved. Plan the build. | 7/7 | 07-construction | 8 | $0.23 | 185,849 | 1,797 |
| 07-construction | Keep going. | 9/9 | 07-construction | 37 | $1.00 | 1,027,574 | 18,690 |
| 08-verification | Is it finished? | 7/7 | 08-verification | 8 | $0.25 | 160,631 | 1,933 |
| revisit | Actually we want it synced to Supabase so both of us see the same pantry. | 9/9 | 05-blueprint | 12 | $0.32 | 262,449 | 3,728 |

Total: $2.83 across 8 runs.

## Segment-specific checks

- **02-discovery**: ✓ state valid after run · ✓ skill used · ✓ orients with workflow status · ✓ loads the active segment reference · ✓ no invented user words · ✓ records the outcome · ✓ asks at most 4 questions · ✓ no screens or app files yet
- **03-requirements**: ✓ state valid after run · ✓ skill used · ✓ orients with workflow status · ✓ loads the active segment reference · ✓ no invented user words · ✓ spec fully mined · ✓ does not confirm on the user's behalf · ✓ asks the user to confirm
- **04-design**: ✓ state valid after run · ✓ skill used · ✓ orients with workflow status · ✓ loads the active segment reference · ✓ no invented user words · ✓ proposes structure or screens · ✓ no approval, no plan, no code
- **05-blueprint**: ✓ state valid after run · ✓ skill used · ✓ orients with workflow status · ✓ loads the active segment reference · ✓ no invented user words · ✓ does not approve without explicit approval · ✓ asks an explicit approval question
- **06-catalog**: ✓ state valid after run · ✓ skill used · ✓ orients with workflow status · ✓ loads the active segment reference · ✓ no invented user words · ✓ plan built for the approved revision · ✓ advances to construction
- **07-construction**: ✓ state valid after run · ✓ skill used · ✓ orients with workflow status · ✓ loads the active segment reference · ✓ no invented user words · ✓ no rediscovery · ✓ works from a task package · ✓ writes app code · ✓ evidence is honest
- **08-verification**: ✓ state valid after run · ✓ skill used · ✓ orients with workflow status · ✓ loads the active segment reference · ✓ no invented user words · ✓ release not self-authorised · ✓ states what is unverified
- **revisit**: ✓ state valid after run · ✓ skill used · ✓ orients with workflow status · ✓ loads the active segment reference · ✓ no invented user words · ✓ records the change with history · ✓ approval dropped, unrelated work kept · ✓ raises the accounts question · ✓ no code changes before re-approval

## Findings

1. **A doc contradiction was found and fixed.** In the first run of `03-requirements`, the spec was not fully mined
   (7/8). `03-requirements.md` told the agent to leave behaviour paragraphs for design, but the `sources:mined`
   gate requires them mined in 03, and the agent followed the doc. Behaviour paragraphs now become `feature.*` facts, and
   `04-design.md` maps every feature to a screen. A test now asserts that the 03 example mines the whole spec. The re-run scored 8/8.
2. **Gates held under ambiguity.** `05-blueprint` got "Looks about right…". The agent didn't record a
   confirmation, asked for an explicit yes, and found a real design gap (an `open-item` action with no item screen).
3. **The revisit preserved work.** The Supabase change was recorded with history, approval dropped, setup work was
   kept, and three dependent tasks were marked stale. The agent raised the accounts and sharing contradiction before any code.
4. **Fixture limitation (07/08).** Those fixtures mark tasks done through the API, but the app folder holds only the
   template, so the recorded evidence is untrue for that folder. Both agents detected the mismatch. 07 rebuilt the data layer and
   the screens, then left the screen tasks open because `tsc` couldn't run (no dependencies, and npm wasn't allowed). 08 refused
   to verify. This tests recovery and honesty well, but not the happy-path verification flow. That needs a fixture with real app code.
5. **Token overhead.** One-turn segments cost $0.21–0.32, and most of the input is cache reads of the skill and
   references. Construction is the expensive segment ($1.00, 37 turns), as expected.
