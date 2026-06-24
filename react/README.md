# @kin-store/react

React bindings for `@kin-store/core`.

## Install

```ts
// Deno / JSR
import { useSelector, useStoreContext, StoreProvider } from "jsr:@kin-store/react";
```

## `useSelector`

Subscribes a component to a store and re-renders when the selected slice changes.
Backed by `useSyncExternalStore` — safe for concurrent mode.

```tsx
import { useSelector } from "@kin-store/react/index.ts";

// Subscribe to the whole state.
function Counter(): JSX.Element {
  const state = useSelector(counterStore);
  return <div>{state.count}</div>;
}

// Subscribe to a slice — only re-renders when `name` changes.
function UserName(): JSX.Element {
  const name = useSelector(userStore, (s) => s.name);
  return <span>{name}</span>;
}
```

## `useSelectorWithEquality`

Like `useSelector`, but accepts a custom equality function. Use this when the
selector returns a new object or array reference on every call (e.g. `.filter()`,
`.map()`, object literals).

```tsx
import { useSelectorWithEquality } from "@kin-store/react/index.ts";

function ActiveTodos(): JSX.Element {
  const active = useSelectorWithEquality(
    todoStore,
    (s) => s.items.filter((item) => !item.completed),
    (a, b) => a.length === b.length && a.every((v, i) => v === b[i]),
  );

  return <ul>{active.map((t) => <li key={t.id}>{t.title}</li>)}</ul>;
}
```

## `StoreProvider` and `useStoreContext`

Inject a store via React context — useful for testing or server-side rendering
where you want to avoid module-level singletons.

```tsx
import { StoreProvider, useStoreContext, useSelector } from "@kin-store/react/index.ts";
import { withPlugins } from "@kin-store/core/index.ts";

const store = withPlugins({ count: 0 }).use({
  reducers: {
    increment: (state, n: number) => ({ ...state, count: state.count + n }),
  },
});

function App(): JSX.Element {
  return (
    <StoreProvider store={store}>
      <Counter />
    </StoreProvider>
  );
}

function Counter(): JSX.Element {
  const store = useStoreContext<typeof store>();
  const count = useSelector(store, (s) => s.count);

  return (
    <button onClick={() => store.dispatch.increment(1)}>
      {count}
    </button>
  );
}
```

`useStoreContext` throws if called outside a `<StoreProvider>` tree.
