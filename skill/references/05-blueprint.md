# Segment 05 — Blueprint

Freeze a revision of the plan with the user's explicit approval. Nothing in the app is built before this gate.
The factory hashes the approved blueprint, and any later change drops the approval automatically.

## 1. Purpose and entry conditions

Enter when `workflow status` reports `segment: "05-blueprint"`. That happens when design is complete and the
current revision isn't approved, including after any post-approval change (`reopened: true`).

## 2. Inspect state first

1. Run `workflow status`. The `05-blueprint` unmet list holds `user:confirmed` and/or `blueprint:approved`.
   `reopened` and `preservedDoneTasks` tell you whether this is a re-approval after a change.
2. Run `blueprint audit`. It must report `ready: true`, apart from the confirmation problem. Any other problem
   means an earlier segment is incomplete. Fix it there.
3. Run `blueprint brief`. This regenerates `.factory/docs/BRIEF.md` and `SCREENS.md`: the artifact you show the user.
4. On re-approval, compare against what was approved before. `DECISIONS.md` shows the history and `staleTasks`
   shows the impact, so you can tell the user exactly what changed.

## 3. Required facts and decisions

| Condition id | Met when |
|---|---|
| `user:confirmed` | A `{"type":"user-confirmation","value":"USER: …"}` decision exists, stamped with the **current** revision |
| `blueprint:approved` | `blueprint approve` succeeded at the current revision (`approval.revision === revision`) |

The audit also re-checks every earlier gate: required answers, screen contracts, entities, roles, and that a
confirmation exists.

## 4. Agent behaviour (reasoning procedure)

1. **Make the decision reviewable.** Summarise the product, the decisions with their sources, the screens (with
   wireframes for the important ones), the data model, the modules that will be added (`module recommend`) and
   anything not yet verified. Keep it to one screen of text, plus the wireframes.
2. **Name the trade-offs and assumptions** the user should consciously accept. For example: "no accounts means no
   sync between phones", or "`patterns.schedulepicker` is a candidate and adds an implementation task".
3. **Ask one explicit approval question.**
4. **On approval:** record the user's exact words as a `user-confirmation` decision, then run `blueprint approve`.
   Both happen in the same turn as the user's reply.
5. **On changes:** route each one to its segment (a fact → 03, a screen → 04), apply it, then come back here with
   a new brief. The old confirmation no longer counts.

## 5. User interaction

- **Mandatory gate.** Approval must be explicit and must answer *this* brief. "Keep going", "sure, whatever you
  think" before seeing the brief, or an approval of an earlier revision don't count.
- If the user approves with changes ("yes, but add a search bar"), apply the change first (04), show the delta,
  and ask again. Keep the delta short.
- On re-approval after a mid-build change, say what's preserved: "Your earlier work on setup and the add-item
  screen stays done; only the pantry list needs rework."

## 6. Commands and schemas

```bash
node scripts/factory.mjs blueprint audit --project <dir>
node scripts/factory.mjs blueprint brief --project <dir>
node scripts/factory.mjs wireframe all --project <dir>
node scripts/factory.mjs module recommend --project <dir>            # modules the plan will install, with reasons
node scripts/factory.mjs blueprint set --project <dir> --file confirm.json
node scripts/factory.mjs blueprint approve --project <dir>
node scripts/factory.mjs workflow status --project <dir>
```

`confirm.json`, using the user's actual reply:

<!-- validate: blueprint @05-blueprint -->
```json
{ "decisions": [{ "type": "user-confirmation", "value": "USER: Looks right, build it" }] }
```

`blueprint approve` returns `{revision, blueprintHash, at}`. It refuses with `Blueprint blocked: N issue(s)` if
the audit isn't ready. An audit problem `User confirmation predates revision N` means the blueprint changed after
the user confirmed: show the change and ask again.

## 7. Outputs and examples

**Approval request:**

> **Pantry Pal: ready to build (rev 9)**
> - For busy home cooks: track food so nothing expires unused. iPhone + Android, works offline, no accounts.
> - **Screens:** Pantry (list, soonest expiry first) → Add item (short form).
> - **Data:** item {name, quantity, expires, usedUp}, stored on the phone.
> - **Added automatically:** navigation, error recovery, on-device storage, form validation.
> - **Not in v1:** shopping lists, barcode scanning, sharing.
> - **Not yet verified:** nothing is device-tested until construction.
>
> Shall I build this? Reply "build it" or tell me what to change.

**After "build it":** record `USER: build it`, run `blueprint approve`, then continue straight into 06 in the same
turn: "Approved (rev 9). Planning the build…"

## 8. Completion criteria

`05-blueprint` shows `complete: true`, `approved: true` in `workflow status`, and the approval hash exists.

## 9. Failure and contradiction handling

| Situation | Handling |
|---|---|
| The audit lists problems other than confirmation | Go to the segment that owns them (decisions → 03, screens/entities/roles → 04) |
| The user approves part and changes part | Apply the changes, regenerate the brief, ask again. Never approve a revision the user hasn't seen. |
| The user says "just build it" without reviewing | Show the brief anyway, compressed to five lines, and ask once. Their reply to that is the confirmation. |
| You recorded a confirmation and then made any change | The confirmation is stale (stamped with the older revision). Ask again. |
| The user rejects the plan wholesale | Ask what's wrong at the product level. That reopens 02 or 03. Keep the facts that still stand. |

## 10. Transitions and revisit rules

- **Advance to 06** immediately after `blueprint approve`.
- **Return to 05** after *any* change to facts or the blueprint once approved. `workflow status` will report it
  with `reopened: true`. Re-approval doesn't redo finished, unaffected work.
