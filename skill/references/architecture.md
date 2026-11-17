# Application architecture

Load this reference when you create or restructure an app's folders, or decide where code belongs. Module-specific
conventions (API client, stores, validation, auth) are in `references/foundations.md`.

## Layout

```
app/                         Expo Router routes and layouts only (thin: read params, call feature hooks, render)
  _layout.tsx                root Stack — from src/foundations/navigation/RootLayout.tsx (or auth/ProtectedLayout.tsx)
  index.tsx                  first screen
  <things>/[id].tsx          detail (push)
  <things>/new.tsx           focused create/edit screen
  (app)/ (auth)/             route groups, only with module.auth
src/ui/                      installed factory components (app-owned copy; see factory-install.json)
src/recipes/                 copied screen recipes, adapted to the app
src/foundations/<module>/    installed construction modules (app-owned copy; see factory-modules.json)
src/features/<feature>/      business capability: types.ts, schema.ts, api.ts, mock.ts, store.ts, use<Thing>.ts
```

## Dependency direction

`app/` → `src/features/` → `src/foundations/` and `src/ui/`. `src/recipes/` imports only `src/ui/`. Shared UI never
imports feature code. Inside `src/ui/` the taxonomy is foundation → primitives → controls → composites → patterns;
imports only point downward.

## State

React local state by default. Persisted or shared state goes through `createStore` (module.persistence) inside a
feature. Server data goes through `useResource`/`useMutation` (module.api-client). Add a heavier state library only
when a recorded requirement proves the need — and record that decision (`blueprint set` decisions).

## Ownership

Copied source (`src/ui`, `src/foundations`, `src/recipes`) belongs to the app. Installers never overwrite files the
app has edited; changes to the factory itself happen in the factory repository (`packages/ui/src`,
`packages/foundations/src`), not in an app.
