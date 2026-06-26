# history

Tracks state history and enables undo / redo / reset. Every state change —
whether dispatched through reducers or made via `setState` — is recorded as a
snapshot.

## Basic usage

```ts
import { withPlugins } from "@kin-store/core/index.ts";
import { history } from "@kin-store/plugins/index.ts";

const store = withPlugins({ count: 0 })
  .use({
    reducers: {
      increment: (state, n: number) => ({ count: state.count + n }),
    },
  })
  .use("history", history());

store.dispatch.increment(1); // count = 1
store.dispatch.increment(1); // count = 2

store.history.canUndo(); // true
store.history.undo(); // count = 1
store.history.redo(); // count = 2
store.history.reset(); // count = 0
```

## Plugin methods

| Method                    | Description                                                               |
| ------------------------- | ------------------------------------------------------------------------- |
| `store.history.canUndo()` | `true` if there is a past state to undo to                                |
| `store.history.canRedo()` | `true` if there is a future state to redo to                              |
| `store.history.undo()`    | Move back one step; returns `true` if moved, `false` if already at start  |
| `store.history.redo()`    | Move forward one step; returns `true` if moved, `false` if already at end |
| `store.history.reset()`   | Restore the baseline state and clear the history                          |
| `store.history.rebase()`  | Make the current state the new undo floor, discarding prior history       |

## Options

| Option  | Type     | Default     | Description                                                  |
| ------- | -------- | ----------- | ------------------------------------------------------------ |
| `limit` | `number` | `undefined` | Max snapshots to keep. When exceeded, the oldest is dropped. |

```ts
.use('history', history({ limit: 50 }))
```

## Composing with persist

After async hydration, call `rebase()` so `undo` and `reset` don't step back to
the pre-hydration state:

```ts
const store = withPlugins({ items: [] as string[] })
  .use("persist", persist({ key: "items" }))
  .use("history", history())
  .use({ reducers: { add: (s, t: string) => ({ items: [...s.items, t] }) } });

await store.persist.hydrationComplete();
store.history.rebase();
```

## Inside middleware

The `history` plugin uses an internal `_restore` reducer to change state, so
every undo and redo travels through the middleware pipeline. A logging
middleware will see it:

```ts
middleware: (ctx, next) => {
  console.log(ctx.reducer.name); // includes "history._restore"
  return next();
},
```

A guard middleware can cancel it:

```ts
middleware: (ctx, next) => {
  if (ctx.reducer.name === 'history._restore' && isLocked) return CANCELED;
  return next();
},
```
