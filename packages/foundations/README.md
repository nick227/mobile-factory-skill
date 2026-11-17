# Construction modules (`module.*`)

These are small, optional modules that get copied into a generated app. They are not a framework: the app owns the copied source in `src/foundations/<module>/`. The installer never overwrites files the app has edited.

```bash
node scripts/factory.mjs module recommend --project <app>     # picks modules from blueprint facts, with reasons
node scripts/factory.mjs module add module.api-client,module.persistence --app <app>
npx expo install <packages printed by the command>
```

| Module | Added when | npm |
|---|---|---|
| `module.navigation` | Every app | — |
| `module.error-boundary` | Every app | — |
| `module.api-client` | `data.source` mentions an API, a server or a mock | — |
| `module.persistence` | `data.persistence` is set, or accounts are required | expo-sqlite, expo-secure-store |
| `module.validation` | A screen uses `TextField` or `recipe.form-screen` | zod |
| `module.env` | `data.source` mentions a remote API | zod |
| `module.auth` | `identity.required = true` | (persistence) |

## App conventions these modules assume

```
app/_layout.tsx              root Stack (from navigation/RootLayout.tsx or ProtectedLayout.tsx)
app/index.tsx                first screen
app/<things>/[id].tsx        detail (push)
app/<things>/new.tsx         focused create/edit screen
src/ui/                      installed factory components
src/foundations/<module>/    installed modules (app-owned)
src/features/<feature>/
  types.ts                   from .factory/docs/model.ts
  schema.ts                  zod schemas (forms and API parsing)
  api.ts                     endpoint functions: listEvents(signal), createEvent(input)…
  mock.ts                    mock routes for createMockTransport
  store.ts                   createStore(...) instances
  use<Thing>.ts              hooks combining api + store
```

- **Screens never call `fetch` or the client directly.** They call `src/features/*/api.ts` functions through `useResource` and `useMutation`.
- **Loading and refresh:** show skeletons only on the first load, keep data visible while refreshing, and show `error.userMessage` with a Retry action.
- **Writes are not retried automatically.** `useMutation` ignores repeated taps while one is pending.
- **Reach the real backend** by switching `createMockTransport(routes).transport` to `fetchTransport(env.EXPO_PUBLIC_API_URL)`. Nothing else changes.
- **Destructive actions** need explicit confirmation (`Alert.alert` with a `destructive` button until a Dialog component exists).

## Verification status

Pure logic is covered by real Node tests (`pnpm --filter @factory/foundations test`): the client, mock transport, resource state, storage, validation, env and the auth state machine. React hooks, the layouts and the device storage backends have only been typechecked against SDK 58 and bundled. They have **not** been run on a device.
