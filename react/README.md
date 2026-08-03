# @kin-store/react

React bindings for `@kin-store/core`.

## Install

```sh [npm]
npx jsr add @kin-store/react
```

```sh [pnpm]
pnpm add jsr:@kin-store/react
```

```sh [deno]
deno add jsr:@kin-store/react
```

## `useStore`

Subscribes a component to a store's whole state and re-renders on every state
change. Backed by `useSyncExternalStore` — safe for concurrent mode.

```tsx
import { useStore } from "@kin-store/react";

function Counter(): JSX.Element {
  const state = useStore(counterStore);
  return <div>{state.count}</div>;
}
```

To subscribe to a transformed value derived from the state, use `useSelector`
instead.

## `useSelector`

Selects a transformed value from the state and re-renders only when that
value changes, using an equality function to decide whether it actually
changed. Defaults to `shallowEqual`, which compares the value one level deep —
safe even when the selector returns a new object or array reference on every
call (e.g. `.filter()`, `.map()`, object literals).

```tsx
import { useSelector } from "@kin-store/react";

// Only re-renders when `name` changes, not on every state update.
function UserName(): JSX.Element {
  const name = useSelector(userStore, (s) => s.name);
  return <span>{name}</span>;
}

function ActiveTodos(): JSX.Element {
  // shallowEqual (the default) prevents a re-render when the filtered
  // list's contents haven't changed, even though .filter() returns a new
  // array reference every call.
  const active = useSelector(
    todoStore,
    (s) => s.items.filter((item) => !item.completed),
  );

  return (
    <ul>
      {active.map((t) => <li key={t.id}>{t.title}</li>)}
    </ul>
  );
}
```

Pass a custom equality function for cases `shallowEqual` can't cover, like
tolerance-based comparisons:

```tsx
const progress = useSelector(
  downloadStore,
  (s) => s.bytesLoaded / s.totalBytes,
  (a, b) => Math.abs(a - b) < 0.001,
);
```

## `StoreProvider` and `useStoreContext`

Inject a store via React context — useful for testing or server-side rendering
where you want to avoid module-level singletons.

```tsx
import {
  StoreProvider,
  useSelector,
  useStoreContext,
} from "@kin-store/react";
import { withPlugins } from "@kin-store/core";

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

  return <button onClick={() => store.dispatch.increment(1)}>{count}</button>;
}
```

`useStoreContext` throws if called outside a `<StoreProvider>` tree.
