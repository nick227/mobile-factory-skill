# Focus-First Native — v0.6 standards

This directory is canonical. The Claude skill receives a snapshot at build time; never edit generated `dist` artifacts.

1. One current subject and a clear next action. Full-screen canvas for media, focused screens for one decision, scrollable content for collections.
2. Content opens related content. Persistent chrome is optional, but native back and explicit dismissal must remain available.
3. Complex input is split only where progression reduces cognitive burden; keep short related fields together.
4. All visible media gets known dimensions/aspect ratio; never resize an item after image decode.
5. Preserve the previous view during background refresh. No empty-to-loaded flashes or remounts.
6. Motion is semantic: press, reveal, presentation, navigation. Respect reduced motion. Do not invent navigation animations.
7. Every essential gesture has a tappable alternative. Never override native back/scroll gestures without reason.
8. Every primary action has idle/pending/success/failure semantics owned by the caller.
9. Use canonical semantic tokens rather than screen-level hardcoded values.
10. Native device verification must be recorded, never inferred from a Node test or TypeScript pass.

See `geometry.md`, `screens.md`, `navigation.md`, `rendering.md`, `quality.md`.
