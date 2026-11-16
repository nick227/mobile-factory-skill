# Factory development rules

1. Maintain the library in `packages/ui/src/` only. Never modify generated `dist/` output.
2. Follow taxonomy `foundation, primitives, controls, composites, patterns`; imports may only point downward or to same-level helpers without cycles.
3. A component requires a catalog record, public export, Lab showcase, and a test file before promotion to stable.
4. Showcase real components; do not replicate their implementation in the Lab.
5. Change behavior and visuals in `packages/ui`, then run `pnpm check` and test on iOS/Android.
6. Generated skill and app templates are outputs; never copy app-specific state or business logic into primitives.
7. Do not state device/browser verification unless explicitly performed.

8. Factory-owned design decisions live in `standards/`; do not hand-edit copies in `dist/`.
9. Default to Focus-First Native: single dominant task, full-screen when useful, content-driven navigation, calm loading, stable media frames.
10. Keep semantic gestures and preserve accessible tap alternatives.
11. `pnpm check` is governance-only; device/Expo validation requires separate verification.
