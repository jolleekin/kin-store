# Writing Plugins

A `StorePlugin` is a plain object with any combination of `reducers`,
`middleware`, `methods`, `onActivated`, and `onDestroy`. Plugins can be shared
and composed independently of the store they are applied to.

## Reducers and internal state

All changes to the store's primary state (`TState`) should go through a reducer,
not `set`. Reducers travel through the full middleware pipeline — they can be
logged, traced, or canceled by any middleware in the chain:

```ts
// Observe every reducer call, including ones from plugins:
((ctx, next) => {
  console.log(ctx.reducer.name); // "history._restore", "persist._restore", ...
  return next();
});

// Cancel a specific reducer under a condition:
((ctx, next) => {
  if (ctx.reducer.name === "persist._restore" && !auth.isReady()) {
    return CANCELED;
  }
  return next();
});
```

`set` bypasses the pipeline by design — use it when you need a hard reset that
must survive middleware that would otherwise cancel it, or when traceability is
not a goal.

Plugin-internal bookkeeping — flags, counters, listener sets — lives in closure
variables, not `TState`.

## Middleware

A plugin can include middleware that runs on every dispatch:

```ts
import { withPlugins } from "@kin-store/core/index.ts";
import type { StorePlugin } from "@kin-store/core/index.ts";

type State = { count: number };

const loggingPlugin: StorePlugin<State> = {
  middleware: (ctx, next) => {
    console.log("->", ctx.reducer.name, ctx.reducer.args);
    const result = next();
    console.log("<-", result);
    return result;
  },
};

const store = withPlugins({ count: 0 }).use(loggingPlugin);
```

## Lifecycle hooks

`onActivated` runs immediately after the plugin is registered; `onDestroy` runs
when `store.destroy()` is called:

```ts
const store = withPlugins({ count: 0 }).use({
  onActivated: (store) => {
    console.log("initial state:", store.get());
  },
  onDestroy: (store) => {
    console.log("final state:", store.get());
  },
});
```

::: warning Avoid patching the store object

`onActivated`, `onDestroy`, and `methods` all receive the full store API, but
avoid mutating or monkey-patching the store object itself. Declare capabilities
through `methods` and `reducers` instead — that keeps plugin contracts explicit
and collision-detectable.

:::

## Dispatching from methods

Use `getPluginDispatch` to call a plugin's own reducers from `methods`,
regardless of whether the plugin is namespaced:

```ts
import { getPluginDispatch } from "@kin-store/core/index.ts";

methods: (store, { namespace }) => {
  const dispatch = getPluginDispatch(store, namespace);
  return {
    undo(): void { dispatch._restore(previousState); },
  };
},
```

## Reusable plugin factories

To write a shareable plugin (like the official `persist` and `history`), wrap it
in a generic factory function. The four type parameters mirror the store's
accumulated shape at the point the plugin is applied:

```ts
import type {
  NestedMethods,
  NestedReducers,
  StorePlugin,
} from "@kin-store/core/index.ts";

type LoggerOptions = { prefix?: string };
type LoggerMethods = { getLogs(): string[] };

export function logger<
  TState,
  TStoreReducers extends NestedReducers<TState>,
  TStoreMethods extends NestedMethods,
  TNamespace extends string | undefined,
>(
  options: LoggerOptions = {},
): StorePlugin<
  TState,
  TStoreReducers,
  TStoreMethods,
  TNamespace,
  {},
  LoggerMethods
> {
  const prefix = options.prefix ?? "→";
  const logs: string[] = [];

  return {
    middleware: () => (ctx, next) => {
      const entry = `${prefix} ${String(ctx.reducer.name)}`;
      logs.push(entry);
      console.log(entry, ctx.reducer.args);
      return next();
    },
    methods: () => ({
      getLogs: () => [...logs],
    }),
  };
}
```

## Constraining which stores a plugin can target

Tighten `TStoreMethods` or `TStoreReducers` to require certain plugins to be
registered first. TypeScript will error if the dependency is missing:

```ts
// Requires a `history` plugin to already be registered.
export function undoOnEscape<
  TState,
  TStoreReducers extends NestedReducers<TState>,
  TStoreMethods extends NestedMethods & { history: { undo(): boolean } },
  TNamespace extends string | undefined,
>(): StorePlugin<TState, TStoreReducers, TStoreMethods, TNamespace> {
  return {
    onActivated(store) {
      document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") store.history.undo();
      });
    },
  };
}

const store = withPlugins({ count: 0 })
  .use("history", history())
  .use(undoOnEscape()); // ✓ — history is present

withPlugins({ count: 0 }).use(undoOnEscape()); // ✗ — type error: history not registered
```
