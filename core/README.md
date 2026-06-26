# @kin-store/core

[![JSR @kin-store/core](https://jsr.io/badges/@kin-store/core)](https://jsr.io/@kin-store/core)
![License: MIT](https://img.shields.io/badge/License-MIT-166534?style=flat)
![Framework-agnostic](https://img.shields.io/badge/Framework--agnostic-166534?style=flat)
![Tiny footprint](https://img.shields.io/badge/Tiny%20footprint-166534?style=flat)
![100% type-safe](https://img.shields.io/badge/100%25%20type--safe-166534?style=flat)
![Zero dependencies](https://img.shields.io/badge/Zero%20dependencies-166534?style=flat)

Reactive state you want to use.

| Style         | API                                             | Minified + Gzip |
| ------------- | ----------------------------------------------- | --------------- |
| Simple        | `createStore` + plain functions                 | 244 B           |
| Zustand-style | `withPlugins` + methods                         | 1.07 KB         |
| Redux-style   | `withPlugins` + reducers + middleware + methods | 1.07 KB         |
| Jotai-style   | `derive`                                        | 465 B           |

Each step is additive — you never undo what you built. Full type safety at every step,
zero dependencies, zero ceremony.

<a href="https://htmlpreview.github.io/?https://raw.githubusercontent.com/jolleekin/kin-store/refs/heads/main/slides/intro.html" target="_blank">View the introduction slides →</a>

## Design principles

### **Explicit over implicit**

No hidden merges, no auto-propagating destroy, no magic dependency graphs. If
something happens, you triggered it. The `CANCELED` sentinel, named reducers, and
the two-tier mutation model all follow from this.

### **Opt-in complexity**

`createStore` is the floor. `withPlugins` adds methods, reducers, middleware,
and lifecycle hooks — only when you import it. `derive` adds reactive composition
— only when you reach for it. You never pay for capability you haven't opted into.

### **Type safety by default**

Every reducer argument, dispatch call, and plugin method is fully inferred — no
`any`, no manual annotation at call sites. The type system is load-bearing, not
decorative.

### **Two tiers of mutation**

Reducers are pure functions. `dispatch.*` routes them through the middleware pipeline —
every state change is observable and traceable. `setState` is the privileged escape
hatch — it bypasses the pipeline intentionally. Plugin methods sit above both: they
can dispatch to stay traceable, call `setState` when they need to escape the pipeline,
or mix both.

---

## Install

See [Installation](../README.md#install) in the root README.

---

## Step 1 — Start simple

A store holds a value and notifies listeners when it changes. Logic lives in
plain top-level functions.

```ts
import { createStore } from "@kin-store/core/index.ts";

type TodoState = { todos: string[]; status: "idle" | "loading" };

const todoStore = createStore({ todos: [], status: "idle" } as TodoState);

function addTodo(text: string): void {
  todoStore.setState((s) => ({ ...s, todos: [...s.todos, text] }));
}

addTodo("Buy groceries");
console.log(todoStore.getState()); // { todos: ["Buy groceries"], status: "idle" }
```

Subscribe to react to changes:

```ts
const unsubscribe = todoStore.subscribe((getState, prevState) => {
  console.log("todos changed:", prevState, "->", getState());
});

// Stop listening:
unsubscribe();
```

---

## Step 2 — Colocate logic (Zustand-style)

When the store grows, move logic inside it using `withPlugins` + `methods`. Each `.use()` call
adds a plugin — not a new nesting level:

```ts
import { withPlugins } from "@kin-store/core/index.ts";

const todoStore = withPlugins({ todos: [], status: "idle" } as TodoState).use({
  methods: (store) => ({
    addTodo(text: string): void {
      store.setState((s) => ({ ...s, todos: [...s.todos, text] }));
    },
    async fetchTodos(): Promise<void> {
      store.setState((s) => ({ ...s, status: "loading" }));
      const todos = await api.fetchTodos();
      store.setState((s) => ({ ...s, todos, status: "idle" }));
    },
  }),
});

todoStore.addTodo("Buy groceries");
await todoStore.fetchTodos();
```

## Step 3 — Add plugins

Plugins extend the store with zero nesting. Each `.use()` adds one feature — never wraps the previous one:

```ts
import { immer, persist, history } from "@kin-store/plugins/index.ts";

const todoStore = withPlugins({ todos: [], status: "idle" } as TodoState)
  .use(immer({
    reducers: {
      addTodo(draft, text: string): void {
        draft.todos.push(text); // Mutate the draft — Immer handles immutability.
      },
      fetchFulfilled(draft, todos: string[]): void {
        draft.todos = todos;
        draft.status = "idle";
      },
    },
  }))
  .use("persist", persist({ key: "todos" }))
  .use("history", history());

todoStore.dispatch.addTodo("Buy groceries");
todoStore.persist.hydrate();
todoStore.history.undo();
```

Compare to Zustand's inside-out middleware nesting:

```ts
// Zustand — each middleware wraps the previous one; read inside-out
import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

const useStore = create<TodoState>()(
  devtools(
    persist(
      immer((set) => ({
        todos: [],
        status: "idle",
        addTodo: (text: string) =>
          set((draft) => {
            draft.todos.push(text);
          }),
      })),
      { name: "todos" },
    ),
  ),
);
```

---

## Step 4 — Add structure and traceability (Redux-style)

Reducers for state changes. Methods for the flow. Middleware to intercept.

Move state mutations into `reducers` when you want auditability — every dispatch travels
through a middleware pipeline you control. Methods orchestrate the flow: calling `dispatch.*`,
handling async logic, or sequencing multiple reducers. App logic goes last — it can depend
on any plugin registered before it.

```ts
import { withPlugins } from "@kin-store/core/index.ts";
import { history, persist } from "@kin-store/plugins/index.ts";

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

    middleware: (ctx, next) => {
      console.log("→", ctx.reducer.name, ctx.reducer.args);
      return next();
    },

    methods: (store) => ({
      async fetchTodos(): Promise<void> {
        store.dispatch.fetchStart();
        try {
          const todos = await api.fetchTodos();
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

Return `CANCELED` from a middleware to abort a dispatch without updating state:

```ts
import { CANCELED } from "@kin-store/core/index.ts";

middleware: (ctx, next) => {
  if (!auth.isLoggedIn()) return CANCELED;
  return next();
},
```

Plugins can also be namespaced. Their reducers and methods are scoped so they
cannot accidentally conflict with other plugins:

```ts
const todoStore = withPlugins({ todos: [] as string[] }).use("todos", {
  reducers: {
    add: (state, text: string) => ({
      todos: [...state.todos, text],
    }),
    clear: () => ({ todos: [] }),
  },

  methods: (store) => ({
    async fetch(): Promise<void> {
      const todos = await api.fetchTodos();
      // Async work stays in methods; state changes go through reducers.
      store.dispatch.todos.add(todos[0]);
    },
  }),
});

todoStore.dispatch.todos.add("Buy groceries");
todoStore.dispatch.todos.clear();

await todoStore.todos.fetch();
```

---

## Step 5 — Compose stores (Jotai / TanStack-style)

Use `derive` to compute values from multiple stores reactively. Dependencies are
tracked automatically — no selector arrays, no manual wiring, no hidden graph.
The derived store stays cold (no subscriptions, no caching) until something
subscribes to it.

```ts
import { createStore, derive } from "@kin-store/core/index.ts";

const userStore = createStore({ name: "Ada", role: "admin" });
const cartStore = createStore({ items: [] as string[], total: 0 });

// Reads from both stores. Recomputes only when either changes.
const summary = derive((get) => ({
  greeting: `Hello, ${get(userStore).name}`,
  itemCount: get(cartStore).items.length,
  total: get(cartStore).total,
}));

console.log(summary.getState());
// { greeting: "Hello, Ada", itemCount: 0, total: 0 }
```

Conditional dependencies — only stores actually read during a recompute are subscribed:

```ts
const isAdmin = derive((get) => get(userStore).role === "admin");

// When isAdmin is false, changes to `adminStore` do not trigger a recompute.
const view = derive((get) =>
  get(isAdmin) ? get(adminStore).dashboard : get(publicStore).feed,
);
```

Use `prev()` to fold the previous computed value into the next (explicit type
required since TypeScript cannot infer `TState` from a self-referential function):

```ts
const delta = createStore(1);
const total = derive<number>((get, prev) => (prev() ?? 0) + get(delta));

total.subscribe((getState) => console.log(getState()));
delta.setState(5); // 6
delta.setState(3); // 9
```

---

## `listenerWithSelector`

Wraps a listener so it only fires when a selected slice of the state changes.
Useful for subscribing to a store outside of React.

```ts
import { listenerWithSelector } from "@kin-store/core/index.ts";

const store = createStore({ count: 0, name: "Alice" });

store.subscribe(
  listenerWithSelector(
    (getSlice, prevSlice) => console.log("count:", prevSlice, "->", getSlice()),
    (state) => state.count,
  ),
);

store.setState({ count: 1, name: "Alice" }); // logs: count: 0 -> 1
store.setState({ count: 1, name: "Bob" }); // no log
```

---

## Writing a plugin

A `StorePlugin` is a plain object with any combination of `reducers`,
`middleware`, `methods`, `onActivated`, and `onDestroy`. Plugins can be shared
and composed independently of the store they are applied to.

### Mutating state from a plugin

All changes to the store's primary state (`TState`) should go through a reducer,
not `setState`. This keeps them visible to middleware — users can log them, trace
them, or cancel them. Both `history` and `persist` follow this: `_restore`
is a plain reducer that travels through the full pipeline, so a logging middleware
will see every undo and every hydration, and a guard middleware can cancel either.

```ts
// Middleware that logs all plugin-internal actions too:
(ctx, next) => {
  console.log(ctx.reducer.name); // "history._restore", "persist._restore", ...
  return next();
};

// Middleware that prevents hydration in a specific condition:
(ctx, next) => {
  if (ctx.reducer.name === "persist._restore" && !auth.isReady())
    return CANCELED;
  return next();
};
```

Plugin-internal bookkeeping — flags, counters, listener sets — lives in closure
variables. It is not `TState` and has no reason to go through the pipeline.
`setState` is the escape hatch for the rare case where you intentionally need to
mutate primary state outside the pipeline (e.g. a hard reset that must survive a
middleware that would otherwise cancel it), or when you're writing a plugin that
is purpose-built for a store with no reducers and pipeline observability is not
a goal.

```ts
import { withPlugins } from "@kin-store/core/index.ts";
import type { StorePlugin } from "@kin-store/core/index.ts";

type State = { count: number };

const loggingPlugin: StorePlugin<State> = {
  middleware: (ctx, next) => {
    console.log("→", ctx.reducer.name, ctx.reducer.args);
    const result = next();
    console.log("←", result);
    return result;
  },
};

const store = withPlugins({ count: 0 }).use(loggingPlugin);
```

`onActivated` and `onDestroy` run once, immediately after the plugin is registered
and when `store.destroy()` is called:

```ts
const store = withPlugins({ count: 0 }).use({
  onActivated: (store) => {
    console.log("initial state:", store.getState());
  },
  onDestroy: (store) => {
    console.log("final state:", store.getState());
  },
});
```

Use `getPluginDispatch` to resolve the correctly-typed dispatch target for a
plugin's own reducers regardless of whether it is namespaced:

```ts
import { getPluginDispatch } from "@kin-store/core/index.ts";

methods: (store, { namespace }) => {
  const dispatch = getPluginDispatch(store, namespace);
  return {
    undo(): void { dispatch._restore(previousState); },
  };
},
```

### Plugin factory functions

To write a reusable, shareable plugin (like the official `persist` and `history`
plugins), wrap it in a generic factory function. The four type parameters mirror
the store's accumulated shape at the point the plugin is applied:

```ts
import type {
  NestedMethods,
  NestedReducers,
  StorePlugin,
} from "@kin-store/core/index.ts";

type LoggerOptions = {
  prefix?: string;
};

type LoggerMethods = {
  getLogs(): string[];
};

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
  {}, // no reducers added by this plugin
  LoggerMethods // methods this plugin adds
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

To constrain which stores the plugin can be applied to, tighten `TStoreMethods`
or `TStoreReducers`. TypeScript will error if the dependency is not registered first:

```ts
// Requires a `history` plugin to already be registered
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
