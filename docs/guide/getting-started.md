# Getting Started

## Install

For vanilla projects:

::: code-group

```sh [npm]
npx jsr add @kin-store/core
```

```sh [pnpm]
pnpm dlx jsr add @kin-store/core
```

```sh [yarn]
yarn dlx jsr add @kin-store/core
```

```sh [deno]
deno add jsr:@kin-store/core
```

:::

For React projects (`@kin-store/core` is included):

::: code-group

```sh [npm]
npx jsr add @kin-store/react
```

```sh [pnpm]
pnpm dlx jsr add @kin-store/react
```

```sh [yarn]
yarn dlx jsr add @kin-store/react
```

```sh [deno]
deno add jsr:@kin-store/react
```

:::

To add official plugins:

::: code-group

```sh [npm]
npx jsr add @kin-store/plugins
```

```sh [pnpm]
pnpm dlx jsr add @kin-store/plugins
```

```sh [yarn]
yarn dlx jsr add @kin-store/plugins
```

```sh [deno]
deno add jsr:@kin-store/plugins
```

:::

## Quick start

Create a store, write plain functions, done:

```ts
import { createStore } from '@kin-store/core/index.ts';

type TodoState = { todos: string[]; status: 'idle' | 'loading' };

const store = createStore({ todos: [], status: 'idle' } as TodoState);

function addTodo(text: string): void {
  store.setState((s) => ({ ...s, todos: [...s.todos, text] }));
}

addTodo('Buy groceries');
console.log(store.getState());
// { todos: ['Buy groceries'], status: 'idle' }
```

When your app grows, move logic into the store with `.use()`:

```ts
import { withPlugins } from '@kin-store/core/index.ts';
import { persist, history } from '@kin-store/plugins/index.ts';

const store = withPlugins({ todos: [], status: 'idle' } as TodoState)
  .use('persist', persist({ key: 'todos' }))
  .use('history', history())
  .use({
    methods: (store) => ({
      addTodo(text: string): void {
        store.setState((s) => ({ ...s, todos: [...s.todos, text] }));
      },
    }),
  });

store.addTodo('Buy groceries');
store.history.undo();
await store.persist.hydrate();
```

Each `.use()` adds capability — not a nesting level. The store grows with you.

## What's next

- [createStore](/guide/create-store) — the minimal foundation
- [withPlugins](/guide/with-plugins) — add methods, reducers, and middleware
- [derive](/guide/derive) — compose stores reactively
- [Plugins](/plugins/) — persist, history, immer
