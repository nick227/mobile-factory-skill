# Mobile Software Factory v0.6

**Single canonical development repository.** `skill/` contains hand-maintained Claude instructions; `dist/mobile-development/` and its ZIP are generated. Never maintain a sibling skill repository as source.

## Start

```bash
corepack enable
pnpm install
pnpm check
pnpm lab
```

## Native checks (must run on configured machines)

```bash
pnpm lab:typecheck
pnpm lab:android
pnpm lab:ios
```

`pnpm check` validates taxonomy/source structure and Node governance tests; it does **not** compile Expo or validate native behavior. Device QA has not been executed in this package release.

## Skill release

```bash
pnpm skill:build
pnpm skill:verify
```

The skill ZIP contains the complete approved preview library, actual TSX, generated catalog, Expo app template, installer, and Focus-First Native standards. Preview does not mean native-certified.

## Team workflow

1. `pnpm component:new controls Example` creates an entry following taxonomy conventions.
2. Develop `packages/ui/src/` directly; the Expo Lab imports the same source.
3. Add real showcase and executable interaction tests. Follow `standards/`.
4. Verify with native devices and record evidence before marking stable.
5. Generate a new skill distribution from canonical source; never modify `dist/`.

## v0.6 emphasis

- 32 cataloged items (24 v0.2 + 8 focus-first additions).
- Geometry/motion tokens; screen headers, input stages, focus layouts, progress, action docks.
- Expo Image stable ratio wrapper, calm skeleton geometry, basic swipe pager with tappable alternative.
- Integrated Lab focus/edit journey with manual delayed/failing save controls.
- Versioned, complete Claude skill distribution with bundled design references.

## Known limitations

- Existing and new `.test.tsx` files include placeholders; native UI tests and screenshot baselines remain to be implemented.
- No verified iOS/Android compilation or rendering in this environment.
- `MediaFrame` preserves geometry but does not attempt a full image-pipeline optimization strategy.
- `SwipePager` demonstrates a simple horizontal peer navigation, not a universal gesture engine.
- Source installer currently copies the complete library; it does not resolve selective transitive imports.
