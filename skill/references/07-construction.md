# Segment 07 — Construction

Build the approved app **one bounded task at a time**. Each task comes with a self-contained package: screen
contract, wireframe, component import lines and props, recipe code, relevant decisions, data model and modules.
Work from the package, not from the conversation, and finish each task with evidence of checks you actually ran.

## 1. Purpose and entry conditions

Enter when `workflow status` reports `segment: "07-construction"`: the approved plan exists and build tasks are
open or stale. A fresh agent resuming a project lands here most often.

## 2. Inspect state first

1. Run `workflow status`. In the `07-construction` unmet list, `tasks:no-stale` names stale tasks and
   `tasks:built` names open build tasks.
2. Run `plan next`, which lists the ready tasks (dependencies done). Pick the first one unless the user asked for a specific one.
3. Run `plan task <id>`. That's the whole context for the task. If `priorEvidence` is present, the task was done
   before a change made it stale. Read it to see what to redo, and why.
4. Inspect the app directory only where the task touches it (for example, the files of a stale screen).

Never re-run discovery or re-read the conversation to rebuild context.

## 3. Required facts and decisions

| Condition id | Met when |
|---|---|
| `tasks:no-stale` | No task has status `stale` (re-approve, then `plan build` turns them back into `todo`) |
| `tasks:built` | Every `setup-*`, `module-*`, `implement-*` and `screen-*` task is `done` |

Within a task, its `acceptance` list is the definition of done.

## 4. Agent behaviour (reasoning procedure)

**Per task:** read the package → implement the smallest complete change → run the checks → record evidence →
`plan next`. Keep going through ready tasks without asking, until a blocker or a gate.

| Task | What to do |
|---|---|
| `setup-project` | Copy `templates/expo-app/` to the app dir (if absent) **and** install the UI source in the same task: `node scripts/install-source.mjs library catalog.json <app> --all`. The template's `app/index.tsx` already imports `src/ui`, so typechecking before the install always fails. Then run `npx expo install --check` and `npx tsc --noEmit`. |
| `setup-design` | `module add` the modules from `module recommend --project <app>`, run the printed `npx expo install …`, and copy `src/foundations/navigation/RootLayout.tsx` to `app/_layout.tsx` (use `ProtectedLayout.tsx` instead when the app has accounts). Check that `useTheme` tokens resolve and the app typechecks. |
| `module-data` | Create `src/features/<feature>/` with `types.ts` (from `.factory/docs/model.ts`), `schema.ts` (zod), `api.ts`, `mock.ts`, `store.ts` and `use<Thing>.ts`, following the module `usage` lines in the package. Add Node tests for pure logic where practical. |
| `module-auth` | Use `module.auth` usage. Signed-in routes go in `app/(app)/`, sign-in in `app/(auth)/`. Cover the success, failure and recovery paths. |
| `implement-<component>` | **Factory repository only:** build the component in `packages/ui/src`, with a test in `packages/ui/tests`, a Lab showcase and a catalog record. In an unpacked skill, you can't promote components: tell the user, and propose an existing alternative. |
| `screen-<id>` | Copy the recipe from `recipes/` into `src/recipes/` and adapt it in `app/<route>.tsx`. Import UI from `@/src/ui` and modules from `@/src/foundations/<module>/…`. Implement every state in `screen.states` and every action. Meet each acceptance line. |

**Composition rules** (also in `references/architecture.md`, `references/foundations.md` and `references/design/`):
- Screens never call `fetch` or the API client directly. They go through `src/features/*/api.ts`, `useResource`
  and `useMutation`.
- Show skeletons only on first load. Keep data visible while refreshing. Errors show `error.userMessage` with Retry.
- Media has a fixed aspect ratio. There's one primary action per screen. Destructive actions are confirmed with `AlertDialog`.
- Key lists by record id, never by index. Never overwrite app files that were edited locally.

**Scope discipline:** build what the task says. If you discover a missing product decision, stop that task and use §9.

## 5. User interaction

- Default to **no questions**. Report progress in short beats: "Done: setup-design (tsc exit 0). Next: module-data."
- Ask only when a task is blocked by a missing decision, a credential, or an acceptance criterion that can't be met as written.
- Show the user something runnable when a screen journey completes ("Run `npx expo start` to try Pantry → Add item").
  Don't claim you tried it on a device.

## 6. Commands and schemas

```bash
node scripts/factory.mjs plan next --project <app>
node scripts/factory.mjs plan task screen-pantry --project <app>
node scripts/factory.mjs catalog get controls.textfield --role construct          # only for parts not in the package
node scripts/factory.mjs module recommend --project <app>
node scripts/factory.mjs module add module.navigation,module.error-boundary,module.persistence,module.validation --app <app>
node scripts/install-source.mjs library catalog.json <app> --all
node scripts/factory.mjs plan done screen-pantry --project <app> --evidence "npx tsc --noEmit exit 0; npx expo export --platform android ok; device review not done"
node scripts/factory.mjs workflow status --project <app>
```

A task package (`plan task`) contains: `task` (id, acceptance, dependsOn), `screen` (contract plus `wireframe`),
`decisions` (the relevant facts only), `model` (TypeScript interfaces), `components` (import, props,
constraints, warnings), `recipe` (`code` and constraints), `modules` (setup and module tasks) and `rules`.

`plan done` returns `{id, status:"done", next:[…]}`. If the task's acceptance needs visual or device review and
your evidence has none, it also returns `gaps`. That's expected: the gap stays visible for 08.

## 7. Outputs and examples

**Good evidence:**
`"npx tsc --noEmit exit 0; node --test src/features/pantry/store.test.ts passed (4); expo export --platform ios ok"`

**Rejected evidence:**
- `"Implemented the screen"`: no check was named.
- `"Tested on device, works"`: a device claim with no platform or OS version.

**Progress beat:**

> Built **Pantry** (recipe.collection-screen): soonest-expiry sort, empty state with Add item, Retry on error.
> Checks: `tsc --noEmit` exit 0, `expo export --platform android` ok. Not device-tested.
> Next: **Add item** form.

## 8. Completion criteria

`07-construction` shows `complete: true`: no stale tasks, all build tasks done with accepted evidence. Then
continue to 08 without asking.

## 9. Failure and contradiction handling

| Situation | Handling |
|---|---|
| A product decision is missing mid-task | Stop the task. Ask one question, record the answer (`interview record` or `blueprint set`), then follow `workflow status`. It may reopen 04 and 05. Never decide product scope silently in code. |
| The user changes a requirement mid-build | SKILL.md §8: record it, report what reopened and what's preserved, re-approve, `plan build`, resume |
| `Task not ready or already complete` | Run `plan next`. A dependency is still open. |
| `Locally modified files would be overwritten` | Never force. Merge the module change by hand, or leave the app's version. |
| `npx expo install` didn't update `package.json` | `npm_config_save=true npx expo install …` |
| A typecheck or bundle fails | Fix it before `plan done`. Never mark a failing task done. If it's blocked outside your control, leave it open and say why. |
| A catalog part doesn't behave as documented | Record it in your report with the exact symptom. Work around it in app code and don't patch `src/ui` silently. In the factory repo, file a regression test. |

## 10. Transitions and revisit rules

- **Advance to 08** when every build task is done.
- **Stale tasks** appear after a re-approved change. Rebuild only those, using `priorEvidence` as a guide.
  Finished, unaffected tasks stay done.
- **Return to 04 or 05** only through recorded changes, never by editing the blueprint's intent in code.
