# @kin-store/plugins

Official plugins for `@kin-store/core`.

| Plugin    | Export                        | Description                                             |
| --------- | ----------------------------- | ------------------------------------------------------- |
| `immer`   | `immer` from `./immer.ts`     | Write reducers and `set` calls as Immer draft mutations |
| `persist` | `persist` from `./persist.ts` | Persist state to storage                                |
| `history` | `history` from `./history.ts` | Undo / redo / reset                                     |

---

## `immer`

Lets you write reducers (and `set` calls) as
[Immer](https://immerjs.github.io/immer/) draft mutations instead of returning
new state objects.

```ts
import { withPlugins } from "@kin-store/core/index.ts";
import { immer } from "@kin-store/plugins/index.ts";

const store = withPlugins({ count: 0, items: [] as string[] }).use(
  immer({
    reducers: {
      increment(draft, amount: number): void {
        draft.count += amount;
      },
      addItem(draft, item: string): void {
        draft.items.push(item);
      },
    },
    methods: (store) => ({
      reset(): void {
        store.set((draft) => {
          draft.count = 0;
          draft.items = [];
        });
      },
    }),
  }),
);

store.dispatch.increment(5);
store.dispatch.addItem("hello");
store.reset();
```

The `immer()` wrapper accepts the same `reducers`, `middlewares`, `methods`,
`onActivated`, and `onDestroy` fields as a standard `StorePlugin`. Inside those
callbacks, `set` accepts a recipe `(draft) => void` instead of a full state
replacement.

---

## `persist`

Persists and hydrates the store state using a storage backend. Defaults to
`localStorage`. Any backend that implements `getItem` / `setItem` / `removeItem`
is accepted — including async ones.

### Basic usage

```ts
import { withPlugins } from "@kin-store/core/index.ts";
import { persist } from "@kin-store/plugins/index.ts";

const store = withPlugins({ count: 0 })
  .use({
    reducers: {
      increment: (state, n: number) => ({ count: state.count + n }),
    },
  })
  .use("persist", persist({ key: "my-counter" }));

store.dispatch.increment(1);
// State is automatically saved to localStorage["my-counter"].
// On the next page load, it is restored automatically.
```

### Persist a slice

```ts
.use("persist", persist({
  key: "app",
  selector: (s) => ({ token: s.token }),
}));
```

### Schema versioning

```ts
.use("persist", persist({
  key: "items",
  version: 1,
  migrate(stored: MyState, version: number): MyState {
    if (version === 0) return { items: stored.todos ?? [] };
    return stored;
  },
}));
```

### Custom async storage

```ts
const asyncStorage: PersistStorage = {
  async getItem(key: string): Promise<string | null> {
     return await myDB.get(key);
      },
  async setItem(key: string, value: string): Promise<void> {
     await myDB.set(key, value);
     },
  async removeItem(key: string): Promise<void> {
    await myDB.delete(key);
    },
};

.use("persist", persist({ key: "data", storage: asyncStorage }));
```

### SSR — skip auto-hydration

```ts
.use("persist", persist({ key: "user", skipHydration: true }));

// On the client, trigger hydration manually:
await store.persist.hydrate();
```

### Plugin methods

Once registered under a namespace (e.g. `"persist"`), the plugin exposes:

| Method                    | Description                                                       |
| ------------------------- | ----------------------------------------------------------------- |
| `hydrationComplete()`     | Promise that resolves after the current or next hydration         |
| `hasHydrated()`           | `true` if at least one hydration has completed                    |
| `hydrate()`               | Triggers a hydration; returns in-progress hydration if one exists |
| `clear()`                 | Removes the persisted value from storage                          |
| `onHydrationStart(cb)`    | Called at the start of each hydration                             |
| `onHydrationComplete(cb)` | Called when a hydration completes                                 |

---

## `history`

Tracks state history and enables undo / redo / reset. Every state change —
whether dispatched through reducers or made via `set` — is recorded as a
snapshot. Pass `{ limit }` to cap memory use in apps with frequent changes.

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

### Plugin methods

| Method      | Description                                                                                                |
| ----------- | ---------------------------------------------------------------------------------------------------------- |
| `canUndo()` | `true` if there is a past state to undo                                                                    |
| `canRedo()` | `true` if there is a future state to redo                                                                  |
| `undo()`    | Move back one step; returns `true` if moved, `false` if already at start                                   |
| `redo()`    | Move forward one step; returns `true` if moved, `false` if already at end                                  |
| `reset()`   | Restore the baseline state and clear the history (with `limit`, baseline is the earliest remembered state) |
| `rebase()`  | Make the current state the new undo floor, discard prior history                                           |

### Options

| Option  | Type     | Default     | Description                                                           |
| ------- | -------- | ----------- | --------------------------------------------------------------------- |
| `limit` | `number` | `undefined` | Max snapshots to keep. When exceeded, the oldest snapshot is dropped. |

### Composing with `persist`

After async hydration, call `rebase()` so `undo` and `reset` do not step back to
the pre-hydration state.

```ts
const store = withPlugins({ items: [] as string[] })
  .use("persist", persist({ key: "items" }))
  .use("history", history())
  .use({ reducers: { ... } });

await store.persist.hydrationComplete();
store.history.rebase();
```
