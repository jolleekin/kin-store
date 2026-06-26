# React

React bindings for `@kin-store/core`.

## Install

::: code-group

```sh [npm]
npx jsr add @kin-store/react
```

```sh [pnpm]
pnpm add jsr:@kin-store/react
```

```sh [deno]
deno add jsr:@kin-store/react
```

`@kin-store/react` depends on and re-exports everything from `@kin-store/core`,
so no need to install it separately.

:::

## `useSelector`

Subscribes a component to a store and re-renders when the selected slice
changes. Backed by `useSyncExternalStore` — safe for concurrent mode.

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

Works with any store — `createStore`, `withPlugins`, or `derive`:

```tsx
const summary = derive((get) => ({
  greeting: `Hello, ${get(userStore).name}`,
  itemCount: get(cartStore).items.length,
}));

function Header() {
  const { greeting, itemCount } = useSelector(summary);
  return (
    <header>
      {greeting} — {itemCount} items
    </header>
  );
}
```

## `useSelectorWithEquality`

Like `useSelector`, but accepts a custom equality function. Use this when the
selector returns a new object or array reference on every call (e.g.
`.filter()`, `.map()`, object literals):

```tsx
import { useSelectorWithEquality } from "@kin-store/react/index.ts";

function ActiveTodos(): JSX.Element {
  const active = useSelectorWithEquality(
    todoStore,
    (s) => s.items.filter((item) => !item.completed),
    (a, b) => a.length === b.length && a.every((v, i) => v === b[i]),
  );

  return (
    <ul>
      {active.map((t) => <li key={t.id}>{t.title}</li>)}
    </ul>
  );
}
```

Without a custom equality function, a selector returning a new array on every
call would cause a re-render on every state change, even unrelated ones.

## `StoreProvider` and `useStoreContext`

Inject a store via React context — useful for testing or SSR where you want to
avoid module-level singletons:

```tsx
import {
  StoreProvider,
  useSelector,
  useStoreContext,
  withPlugins,
} from "@kin-store/react/index.ts";

const store = withPlugins(0).use({
  reducers: {
    increment: (state, n: number) => state + n,
  },
});

type Store = typeof store;

function App(): JSX.Element {
  return (
    <StoreProvider store={store}>
      <Counter />
    </StoreProvider>
  );
}

function Counter(): JSX.Element {
  const store = useStoreContext<Store>();
  const count = useSelector(store);

  return <button onClick={() => store.dispatch.increment(1)}>{count}</button>;
}
```

`useStoreContext` throws if called outside a `<StoreProvider>` tree.

## Actions are stable refs

Methods and dispatch functions on a `withPlugins` store are stable references —
they don't change between renders. You can call them directly without
subscribing:

```tsx
function AddButton() {
  // No useSelector needed — just call the method directly.
  return <button onClick={() => todoStore.addTodo("new item")}>Add</button>;
}
```

This avoids the Zustand pattern of `useStore(s => s.addTodo)` which registers a
subscription for a value that never changes.
