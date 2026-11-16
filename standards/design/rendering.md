# Rendering, media and loading stability

- Use stable keys derived from record IDs, never random keys or indices for reorderable items.
- Keep rapidly changing state local. Use stable references where required; profile before broad memoization.
- Avoid remounting screens and whole-screen loading placeholders on background refetches.
- Media requires explicit `aspectRatio` or dimensions. The container is reserved prior to load.
- Make object-fit and fallback intentional; use Expo Image cache for supported sources.
- Do not reflow when images decode. Avoid flickering empty state between pending and populated data.
- Use calm static skeleton geometry matching the final content; avoid gratuitous shimmer.
- Stress modes must cover latency, failed saves, slow media, keyboard, large text, rapid repeat taps.
