---
description: "Install @kintools/store-core, @kintools/store-react, or @kintools/store-plugins from JSR, write your first store with createStore, and grow it with withPlugins."
---

# Getting Started

## Install

For vanilla projects:

::: code-group

```sh [npm]
npm add @kintools/store-core
```

```sh [pnpm]
pnpm add @kintools/store-core
```

```sh [yarn]
yarn add @kintools/store-core
```

```sh [deno]
deno add jsr:@kintools/store-core
```

:::

For React projects (`@kintools/store-core` is included):

::: code-group

```sh [npm]
npm add @kintools/store-react
```

```sh [pnpm]
pnpm add @kintools/store-react
```

```sh [yarn]
yarn add @kintools/store-react
```

```sh [deno]
deno add jsr:@kintools/store-react
```

:::

To add official plugins:

::: code-group

```sh [npm]
npm add @kintools/store-plugins
```

```sh [pnpm]
pnpm add @kintools/store-plugins
```

```sh [yarn]
yarn add @kintools/store-plugins
```

```sh [deno]
deno add jsr:@kintools/store-plugins
```

:::

## Quick start

Create a store, write plain functions, done:

```ts
import { createStore } from "@kintools/store-core";

type TodoState = { todos: string[]; status: "idle" | "loading" };

const store = createStore({ todos: [], status: "idle" } as TodoState);

function addTodo(text: string): void {
  store.set((s) => ({ ...s, todos: [...s.todos, text] }));
}

addTodo("Buy groceries");
console.log(store.get());
// { todos: ['Buy groceries'], status: 'idle' }
```

When your app grows, move logic into the store with `.use()`:

```ts
import { withPlugins } from "@kintools/store-core";
import { history, persist } from "@kintools/store-plugins";

const store = withPlugins({ todos: [], status: "idle" } as TodoState)
  .use("persist", persist({ key: "todos" }))
  .use("history", history())
  .use({
    methods: (store) => ({
      addTodo(text: string): void {
        store.set((s) => ({ ...s, todos: [...s.todos, text] }));
      },
    }),
  });

store.addTodo("Buy groceries");
store.history.undo();
await store.persist.hydrate();
```

Each `.use()` adds capability, not a nesting level. The store grows with you.

## What's next

- [createStore](/guide/create-store) — the minimal foundation
- [withPlugins](/guide/with-plugins) — add methods, reducers, and middleware
- [derive](/guide/derive) — compose stores reactively
- [Plugins](/plugins/) — persist, history, immer
