# Writing Plugins

A `StorePlugin` is a plain object with any combination of `reducers`, `middleware`, `methods`, `onActivated`, and `onDestroy`. Plugins can be shared and composed independently of the store they are applied to.

## A simple logging plugin

```ts
import { withPlugins } from '@kin-store/core';
import type { StorePlugin } from '@kin-store/core';

type State = { count: number };

const loggingPlugin: StorePlugin<State> = {
  middleware: (ctx, next) => {
    console.log('→', ctx.reducer.name, ctx.reducer.args);
    const result = next();
    console.log('←', result);
    return result;
  },
};

const store = withPlugins({ count: 0 }).use(loggingPlugin);
```

## Lifecycle hooks

`onActivated` runs immediately after the plugin is registered. `onDestroy` runs when `store.destroy()` is called:

```ts
const store = withPlugins({ count: 0 }).use({
  onActivated: (store) => {
    console.log('initial state:', store.getState());
  },
  onDestroy: (store) => {
    console.log('final state:', store.getState());
  },
});
```

## Mutating state from a plugin

All changes to the store's primary state should go through a reducer, not `setState`. This keeps them visible to middleware — users can log them, trace them, or cancel them.

The official `persist` and `history` plugins follow this: their internal `_restore` reducer travels through the full pipeline, so a logging middleware sees every undo and every hydration:

```ts
// Middleware that logs all plugin-internal actions too.
middleware: (ctx, next) => {
  console.log(ctx.reducer.name); // "history._restore", "persist._restore", ...
  return next();
},

// Middleware that prevents hydration until auth is ready.
middleware: (ctx, next) => {
  if (ctx.reducer.name === 'persist._restore' && !auth.isReady()) return CANCELED;
  return next();
},
```

Use `setState` only for plugin-internal bookkeeping or as an intentional escape hatch that must bypass the pipeline.

## Using `getPluginDispatch`

When a plugin needs to dispatch its own reducers, use `getPluginDispatch` to resolve the correctly-typed dispatch target regardless of whether the plugin is namespaced:

```ts
import { getPluginDispatch } from '@kin-store/core';

methods: (store, { namespace }) => {
  const dispatch = getPluginDispatch(store, namespace);
  return {
    undo(): void { dispatch._restore(previousState); },
  };
},
```

## Reusable plugin factories

To write a shareable plugin (like the official `persist` and `history`), wrap it in a generic factory function. The four type parameters mirror the store's accumulated shape at the point the plugin is applied:

```ts
import type { NestedMethods, NestedReducers, StorePlugin } from '@kin-store/core';

type LoggerOptions = { prefix?: string };
type LoggerMethods = { getLogs(): string[] };

export function logger<
  TState,
  TStoreReducers extends NestedReducers<TState>,
  TStoreMethods extends NestedMethods,
  TNamespace extends string | undefined,
>(
  options: LoggerOptions = {},
): StorePlugin<TState, TStoreReducers, TStoreMethods, TNamespace, {}, LoggerMethods> {
  const prefix = options.prefix ?? '→';
  const logs: string[] = [];

  return {
    middleware: (ctx, next) => {
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

Tighten `TStoreMethods` or `TStoreReducers` to require certain plugins to be registered first. TypeScript will error if the dependency is missing:

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
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') store.history.undo();
      });
    },
  };
}

const store = withPlugins({ count: 0 })
  .use('history', history())
  .use(undoOnEscape()); // ✓ — history is present

withPlugins({ count: 0 })
  .use(undoOnEscape()); // ✗ — type error: history not registered
```
