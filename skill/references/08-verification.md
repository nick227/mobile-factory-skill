# Segment 08 — Verification & handoff

Prove what was built, make every unproven claim visible, recover from failures, and hand off honestly. The rule
that governs everything here: **report only what you ran.** TypeScript passing, a bundle building and mocked tests
are not device verification.

## 1. Purpose and entry conditions

Enter when `workflow status` reports `segment: "08-verification"` (all build tasks done), or `segment: "complete"`
when the user asks for a handoff or a status report.

## 2. Inspect state first

1. Run `workflow status`. In the `08-verification` unmet list: `tasks:verified` and `release:authorised`. The
   advisory `gaps:none` lists tasks completed without device or visual evidence.
2. Run `plan next`, which lists the ready `verify-<screen>` tasks.
3. Run `plan task verify-<screen>` to get the screen contract and acceptance to check against.
4. Run `blueprint brief`. Its `Unverified` section is the honest list of gaps.

## 3. Required facts and decisions

| Condition id | Met when |
|---|---|
| `tasks:verified` | Every `verify-<screen>` task is done with evidence of executed checks |
| `release:authorised` | `release-readiness` is done with `USER-APPROVED: <user's words>` |
| `gaps:none` (advisory) | No task has recorded gaps. Otherwise, each gap appears in the handoff. |

## 4. Agent behaviour (reasoning procedure)

For each `verify-<screen>`:
1. **Static checks:** run `npx tsc --noEmit` in the app.
2. **Build check:** run `npx expo export --platform android` (and `ios` when targeted). This proves bundling, not behaviour.
3. **Logic checks:** run the app's Node tests for features, stores and validation, if they exist.
4. **Contract review:** go through each `screen.states` entry and each `acceptance` line, and point to the code
   that satisfies it. A criterion with no code is a defect. Fix it first (that reopens the screen task: mark nothing done).
5. **Device or visual review:** only if you actually ran it (simulator, emulator, device or browser). Record the
   platform and OS version. If you didn't, write "device review not done". The task gets a visible `gap`.
6. Run `plan done verify-<screen> --evidence "<every check and result>"`.

Then prepare the **handoff** (§7) and ask for release authorisation.

## 5. User interaction

- **Mandatory gate:** release authorisation. Show the handoff and ask explicitly. Record their words with
  `USER-APPROVED:`.
- Offer the user the verification steps you couldn't run, as a short checklist (e.g. "On your phone: open
  Pantry, add an item, kill the app, reopen it: the item should still be there").
- If the user reports a defect, it's a construction fix (07), not a new segment. Record the device evidence they
  give you, with platform and version.

## 6. Commands and schemas

```bash
node scripts/factory.mjs plan next --project <app>
node scripts/factory.mjs plan task verify-pantry --project <app>
(cd <app> && npx tsc --noEmit && npx expo export --platform android)
node scripts/factory.mjs plan done verify-pantry --project <app> --evidence "npx tsc --noEmit exit 0; npx expo export --platform android ok; acceptance reviewed in code (3/3); device review not done"
node scripts/factory.mjs blueprint brief --project <app>
node scripts/factory.mjs plan done release-readiness --project <app> --evidence "USER-APPROVED: ship it to TestFlight"
node scripts/factory.mjs workflow status --project <app>
```

Device evidence, when real, looks like this: `"Android 16 Pixel 8 emulator: add item, restart, item persists; TalkBack labels ok"`.
Without the platform and version, the engine rejects device claims.

## 7. Outputs and examples

**Handoff** (also the final message of the project):

> **Pantry Pal: handoff (rev 9, approved)**
> - **Built:** Pantry list (soonest expiry first, empty/error/retry), Add item form (validation, failed save keeps input). Data on device.
> - **Checked:** `tsc --noEmit` exit 0 · `expo export` android + ios ok · store logic tests 4/4 passed · acceptance reviewed in code.
> - **Not verified:** no device or simulator run yet (iOS and Android). Visual review pending for both screens.
> - **Try it:** `cd pantry-pal && npx expo start`, then add an item, restart the app and check it's still there.
> - **Next decisions:** sharing between households (needs accounts) was out of scope for v1.
>
> Do you authorise this as release-ready? Your words will be recorded.

**Never write:** "Fully tested and production-ready", "Works on iOS and Android" (without device evidence), or
"Verified" (that's a recorded maturity level).

## 8. Completion criteria

`workflow status` returns `segment: "complete"`. Every verify task is done, and release is authorised with the
user's words. Gaps are either closed with evidence or listed in the handoff.

## 9. Failure and contradiction handling

| Situation | Handling |
|---|---|
| A check fails | Don't mark the verify task done. Fix it in the screen's code, re-run the checks, then record the evidence. |
| An acceptance criterion isn't met | It's a construction defect. Fix the code under the existing screen task, then verify. If the criterion itself is wrong, change it through 04 (re-approval needed). |
| The user won't authorise release | Ask what's missing. A defect → 07. A new requirement → record it (03/04), and the engine reopens what it affects. |
| The user says "it works on my phone" | Record it as evidence only with platform and OS: ask "Which phone and OS version?" |
| The tooling can't run (no Expo CLI, no network) | Say exactly which check couldn't run and why. Leave the verify task open, or record evidence of what did run plus "<check> not run: <reason>". |

## 10. Transitions and revisit rules

- **Complete** after release authorisation. Deliver the handoff and stop.
- **Back to 07** for defects. **Back to 03/04** for new requirements. **Back to 05** after any recorded change. The
  engine preserves verified, unaffected work.
- In a new conversation on a completed project, `workflow status` returns `complete`. Answer questions or start a
  change from SKILL.md §8.
