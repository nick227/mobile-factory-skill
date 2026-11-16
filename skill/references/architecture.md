# Application architecture

- `app/` Expo Router route entrypoints and navigation layouts only.
- `src/ui/` installed production-ready UI source, app-owned.
- `src/features/` business capabilities, feature views, feature hooks, feature-local API and types.
- `src/services/` transport and platform integrations only when needed.
- `src/providers/` root providers only when justified.

Import down the UI taxonomy; avoid importing feature code from shared components. Use React local state by default; adopt heavier dependencies only when the application proves a need.
