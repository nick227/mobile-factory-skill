# Factory v1.0: Blueprint-first production workflow

The **factory owns reusable source, catalogs, workflow state, and checks**. The **AI owns conversation, design decisions, and JSX composition**; the user owns approvals. This reference accompanies the normal v0.6 native UI skill. Do not bypass its component and design standards.

## First interaction: planning, not coding
1. Identify whether this is a new app or an existing app. Obtain the user's goal and inspect only relevant existing project context.
2. Run the embedded `node scripts/factory.mjs` from the skill release folder, or use the same command from the factory repository. Start with `node scripts/factory.mjs project status --project <project>`, or initialize the project. The user can remain in discovery/design indefinitely.
3. Use `discovery next`, then ask targeted questions, listening for corrections. Record structured answers with `project update --file ...`. Questions about UX, visual direction and screen composition can cycle freely.
4. Query `catalog search`, then `catalog get <id>` **on demand**. Prefer curated components, snippets and standards. Preview components are not certified.
5. Write a proposed screen inventory with route, purpose, curated components, actions, states and acceptance outcomes. Capture data entities, auth provider, permissions, fixture scenarios, integrations and genuine unsupported gaps. Avoid guessing missing decisions.
6. Run `blueprint audit` and `blueprint export`. Review the human-readable plan with the user. **Do not approve on the user's behalf.** After explicit confirmation, record a `user-confirmation` decision with evidence, then invoke `blueprint approve`.
7. Invoke `plan build`; execute only one eligible task at a time using `plan task <id>`. Use the actual `@factory/ui` component contracts and compose JSX rather than recreating curated components. Generator coverage in v1.0 foundation is limited: do not claim full JSX or auth generation exists.
8. Run real checks and ask for visual review when relevant. `plan done` requires a summary of actual verification evidence; do not invent success. The task graph is a planning aid, not a substitute for technical assessment.
9. At release, preserve user authorization, check platform-dependent workflows, and record what was actually tested. In maintenance, revise the blueprint; revisions invalidate approval and the old task list.

## Token/context policy
- Read project status and **only the current task package** by default; avoid rereading whole chat histories or repositories.
- Load catalog entries relevant to the current task; do not paste full catalog or code into every context.
- Keep decisions in the canonical `.factory/project.json`. Human-readable `.factory/docs/` is a projection, not a competing authority.
- Use conditional workflows for authentication, persistence and platform requirements.
- A fresh agent should resume from project state, approved revision, and next task without the original chat.

## API quick reference (in factory repository or unpacked skill release)

```bash
node scripts/factory.mjs help
node scripts/factory.mjs catalog search --query focus
node scripts/factory.mjs project init --project /path/to/app --name 'My App'
node scripts/factory.mjs discovery next --project /path/to/app
node scripts/factory.mjs project update --project /path/to/app --file app-decisions.json
node scripts/factory.mjs blueprint audit --project /path/to/app
node scripts/factory.mjs blueprint export --project /path/to/app
# Explicit user approval first:
node scripts/factory.mjs blueprint approve --project /path/to/app
node scripts/factory.mjs plan build --project /path/to/app
node scripts/factory.mjs plan next --project /path/to/app
node scripts/factory.mjs plan task screen-home --project /path/to/app
```

## Important boundaries
The v1.0 foundation contains blueprint and workflow tools; it **does not** yet implement fully deterministic screen generation, authenticated provider modules, fixture executors, visual regression or shipping to stores. Those are upcoming capabilities. Do not imply they exist. No application source should be created during discovery or design.
