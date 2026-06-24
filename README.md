# kin-store

[![JSR @kin-store](https://jsr.io/badges/@kin-store)](https://jsr.io/@kin-store)
![License: MIT](https://img.shields.io/badge/License-MIT-166534?style=flat-square)
![Tiny footprint](https://img.shields.io/badge/Tiny%20footprint-166534?style=flat-square)
![100% type-safe](https://img.shields.io/badge/100%25%20type--safe-166534?style=flat-square)
![Zero dependencies](https://img.shields.io/badge/Zero%20dependencies-166534?style=flat-square)

Framework-agnostic reactive state that grows with you — without locking you into a paradigm.

| Style         | API                                             | Minified + Gzip |
| ------------- | ----------------------------------------------- | --------------- |
| Simple        | `createStore` + plain functions                 | 244 B           |
| Zustand-style | `withPlugins` + methods                         | 1.07 KB         |
| Redux-style   | `withPlugins` + reducers + middleware + methods | 1.07 KB         |
| Jotai-style   | `derive`                                        | 465 B           |

Each style is additive — you never undo what you built. Full type safety at every step, zero dependencies.

<a href="https://htmlpreview.github.io/?https://raw.githubusercontent.com/jolleekin/kin-store/refs/heads/main/docs/intro.html" target="_blank">View the introduction slides →</a>

## Install

```bash
# Core
deno add jsr:@kin-store/core
pnpm add jsr:@kin-store/core
yarn add jsr:@kin-store/core
npx  jsr add @kin-store/core

# React bindings
deno add jsr:@kin-store/react
pnpm add jsr:@kin-store/react
yarn add jsr:@kin-store/react
npx  jsr add @kin-store/react

# Official plugins
deno add jsr:@kin-store/plugins
pnpm add jsr:@kin-store/plugins
yarn add jsr:@kin-store/plugins
npx  jsr add @kin-store/plugins
```

## Taste

Start with a plain store and top-level functions:

```ts
import { createStore } from "@kin-store/core/index.ts";

type State = { todos: string[]; status: "idle" | "loading" };

const store = createStore({ todos: [], status: "idle" } as State);

function addTodo(text: string): void {
  store.setState((s) => ({ ...s, todos: [...s.todos, text] }));
}
```

Add capability with `.use()` when you need it — flat chaining, never nesting:

```ts
import { withPlugins } from "@kin-store/core/index.ts";
import { history, persist } from "@kin-store/plugins/index.ts";

type State = { todos: string[]; status: "idle" | "loading" };

const store = withPlugins({ todos: [], status: "idle" } as State)
  // Register namespaced plugins.
  .use("persist", persist({ key: "todos" }))
  .use("history", history())

  // Register a top-level plugin.
  .use({
    reducers: {
      add: (state, text: string) => ({
        ...state,
        todos: [...state.todos, text],
      }),
    },
    methods: (store) => ({
      async fetch(): Promise<void> {
        // Call `setState` directly if you don't need the dispatch pipeline.
        store.setState((s) => ({ ...s, status: "loading" }));

        const todos = await api.getTodos();

        store.setState({ todos, status: "idle" });
      },
    }),
  });

// Dispatch an action.
store.dispatch.add("Buy groceries");

// Call methods.
store.history.undo();
await store.persist.hydrate();
await store.fetch();
```

Compare to Zustand's inside-out middleware nesting — each capability wraps the
previous one and must be read from the inside out:

```ts
import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

type State = { todos: string[]; status: "idle" | "loading" };

type Actions = {
  addTodo(text: string): void;
  async fetch(): Promise<void>;
}

const useStore = create(
  devtools(
    persist(
      immer<State & Actions>((set) => ({ // Explicit type annotation required.
        todos: [],
        status: "idle",
        addTodo(text: string) {
          set((draft) => {
            draft.todos.push(text);
          });
        },
        async fetch() {
          set((draft) => { draft.status = "loading"; });
          const todos = await api.getTodos();
          set({ todos, status: "idle" });
        }
      })),
      { name: "todos" },
    ),
    { name: "TodoStore" },
  ),
);
```

## Packages

| Package                                     | Description                                                  |
| ------------------------------------------- | ------------------------------------------------------------ |
| [`@kin-store/core`](./core/README.md)       | `createStore`, `withPlugins`, `derive` — the core primitives |
| [`@kin-store/plugins`](./plugins/README.md) | `persist`, `history`, `immer` — official plugins             |
| [`@kin-store/react`](./react/README.md)     | `useSelector`, `useSelectorWithEquality` — React bindings    |

```

```
