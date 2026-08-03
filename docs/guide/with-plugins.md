---
description: "withPlugins upgrades a store with reducers, middleware, methods, and lifecycle hooks added one .use() call at a time, each fully typed and namespaceable."
---

# withPlugins

Opt-in structure: methods, reducers, middleware, lifecycle hooks, namespaced
plugins.

```ts
import { withPlugins } from "@kin-store/core";
```

`withPlugins` upgrades a store (or creates one) with a plugin system. Each
`.use()` call adds capability, not a nesting level. The store's type is updated
at each step, so TypeScript always knows exactly what's available.

## Concepts

| Term           | Definition                                                                                                                                                   |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Plugin**     | Extra capability added to a store — reducers, middleware, methods, or lifecycle hooks. Each `.use()` call registers one plugin.                              |
| **Reducer**    | A pure function `(state, ...args) => nextState` that performs a named state transition. Called via `dispatch.*` and travels through the middleware pipeline. |
| **Middleware** | A pipeline interceptor `(ctx, next) => ...` that runs on every `dispatch.*` call. Can observe, modify, or cancel a dispatch.                                 |

## Step 1 — Colocate logic with methods

Move logic inside the store using `methods`. Each method receives the full store
API:

```ts
type TodoState = { todos: string[]; status: "idle" | "loading" | "failed" };

const todoStore = withPlugins({ todos: [], status: "idle" } as TodoState).use({
  methods: (store) => ({
    addTodo(text: string): void {
      store.set((s) => ({ ...s, todos: [...s.todos, text] }));
    },
    async fetchTodos(): Promise<void> {
      store.set((s) => ({ ...s, status: "loading" }));
      try {
        const todos = await api.getTodos();
        store.set({ todos, status: "idle" });
      } catch {
        store.set((s) => ({ ...s, status: "failed" }));
      }
    },
  }),
});

todoStore.addTodo("Buy groceries");
await todoStore.fetchTodos();
```

## Step 2 — Add plugins

Plugins can be **namespaced** (`.use(namespace, plugin)`) or **top-level**
(`.use(plugin)`). Namespaced plugins live under their own key — no conflicts, no
surprises:

```ts
import { history, persist } from "@kin-store/plugins";

const todoStore = withPlugins({ todos: [], status: "idle" } as TodoState)
  .use("persist", persist({ key: "todos" }))
  .use("history", history())
  .use({
    methods: (store) => ({
      addTodo(text: string): void {
        store.set((s) => ({ ...s, todos: [...s.todos, text] }));
      },
    }),
  });

todoStore.addTodo("Buy groceries");
todoStore.history.undo();
await todoStore.persist.hydrate();
```

## Step 3 — Extract mutations into reducers

When you want traceability, extract state mutations into `reducers`. Each
reducer is a pure function `(state, ...args) => nextState`. Reducers are called
through `store.dispatch.*` — they travel through the full middleware pipeline,
making every state change observable and traceable.

```ts
import { CANCELED, withPlugins } from "@kin-store/core";
import { history, persist } from "@kin-store/plugins";

type Todo = { id: number; text: string; done: boolean };
type TodoState = { todos: Todo[]; status: "idle" | "loading" | "failed" };

const todoStore = withPlugins<TodoState>({ todos: [], status: "idle" })
  .use("persist", persist({ key: "todos" }))
  .use("history", history())
  .use({
    reducers: {
      addTodo: (state, text: string) => ({
        ...state,
        todos: [...state.todos, { id: Date.now(), text, done: false }],
      }),
      fetchStart: (state) => ({ ...state, status: "loading" }),
      fetchFulfilled: (state, todos: Todo[]) => ({ todos, status: "idle" }),
      fetchRejected: (state) => ({ ...state, status: "failed" }),
    },

    middleware: () => (ctx, next) => {
      console.log("→", ctx.reducer.name, ctx.reducer.args);
      return next();
    },

    methods: (store) => ({
      async fetchTodos(): Promise<void> {
        store.dispatch.fetchStart();
        try {
          const todos = await api.getTodos();
          store.dispatch.fetchFulfilled(todos);
        } catch {
          store.dispatch.fetchRejected();
        }
      },
    }),
  });

todoStore.dispatch.addTodo("Buy groceries");
await todoStore.fetchTodos();
todoStore.history.undo();
```

## Two tiers of mutation

| Tier         | How                                    | Good fit for                                                 |
| ------------ | --------------------------------------- | -------------------------------------------------------------- |
| `dispatch.*` | Routes through the middleware pipeline | Changes you want every plugin to see: logging, undo, guards  |
| `set`        | Writes state directly, no pipeline     | Simple stores, or changes that don't need the pipeline        |

Neither tier is a fallback for the other — pick per store, or per method.
`methods: (store) => ({...})` with `set` calls only is a complete store on its
own; `reducers` dispatched via `dispatch.*` is a complete store built the other
way. A method can also mix both in the same call when part of a change should
be traceable and part shouldn't.

If your team standardizes on one style — e.g. "every mutation goes through
`dispatch.*`" — hold that convention at your store module's boundary (export
`dispatch` and your methods, not `set`) rather than expecting the library to
block direct `set` calls; see
[Two tiers of mutation](./design-principles.md#two-tiers-of-mutation) in
Design Principles for the full reasoning.

## Canceling a dispatch

Return `CANCELED` from a middleware to abort a dispatch without updating state:

```ts
import { CANCELED } from '@kin-store/core';

middleware: () => (ctx, next) => {
  if (!auth.isLoggedIn()) return CANCELED;
  return next();
},
```

## Namespaced plugins with reducers

Plugins can include their own reducers and methods, scoped under a namespace to
prevent conflicts:

```ts
const store = withPlugins({ todos: [] as string[] }).use("todos", {
  reducers: {
    add: (state, text: string) => ({ todos: [...state.todos, text] }),
    clear: () => ({ todos: [] }),
  },
  methods: (store) => ({
    async fetch(): Promise<void> {
      const resp = await fetch("/api/todos");
      const todos = await resp.json();
      store.dispatch.todos.add(todos[0]);
    },
  }),
});

store.dispatch.todos.add("Buy groceries");
store.dispatch.todos.clear();
await store.todos.fetch();
```

## Plugin options

A plugin passed to `.use()` is a plain object with any combination of:

| Field         | Description                                          |
| ------------- | ------------------------------------------------------ |
| `reducers`    | Pure functions `(state, ...args) => nextState`       |
| `middleware`  | Factory returning middleware function(s)             |
| `methods`     | Factory returning methods added to the store         |
| `onActivated` | Runs once immediately after the plugin is registered |
| `onDestroy`   | Runs when `store.destroy()` is called                |
