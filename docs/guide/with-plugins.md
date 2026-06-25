# withPlugins

Opt-in structure: methods, reducers, middleware, lifecycle hooks, namespaced plugins.

```ts
import { withPlugins } from '@kin-store/core';
```

`withPlugins` upgrades a store with a plugin system. Each `.use()` call adds capability — not a nesting level. The store's type is updated at each step, so TypeScript always knows exactly what's available.

## Step 1 — Colocate logic with methods

Move logic inside the store using `methods`. Each method receives the full store API:

```ts
type TodoState = { todos: string[]; status: 'idle' | 'loading' | 'failed' };

const todoStore = withPlugins({ todos: [], status: 'idle' } as TodoState)
  .use({
    methods: (store) => ({
      addTodo(text: string): void {
        store.setState((s) => ({ ...s, todos: [...s.todos, text] }));
      },
      async fetchTodos(): Promise<void> {
        store.setState((s) => ({ ...s, status: 'loading' }));
        try {
          const todos = await api.getTodos();
          store.setState({ todos, status: 'idle' });
        } catch {
          store.setState((s) => ({ ...s, status: 'failed' }));
        }
      },
    }),
  });

todoStore.addTodo('Buy groceries');
await todoStore.fetchTodos();
```

## Step 2 — Add namespaced plugins

Plugins are added with `.use(namespace, plugin)`. Each sits under its own key — no conflicts, no surprises:

```ts
import { history, persist } from '@kin-store/plugins';

const todoStore = withPlugins({ todos: [], status: 'idle' } as TodoState)
  .use('persist', persist({ key: 'todos' }))
  .use('history', history())
  .use({
    methods: (store) => ({
      addTodo(text: string): void {
        store.setState((s) => ({ ...s, todos: [...s.todos, text] }));
      },
    }),
  });

todoStore.addTodo('Buy groceries');
todoStore.history.undo();
await todoStore.persist.hydrate();
```

## Step 3 — Extract mutations into reducers

When you want auditability, extract state mutations into `reducers`. Each reducer is a pure function `(state, ...args) => nextState`. Reducers are called through `store.dispatch.*` — they travel through the full middleware pipeline, making every state change observable and traceable.

```ts
import { withPlugins, CANCELED } from '@kin-store/core';
import { history, persist } from '@kin-store/plugins';

type Todo = { id: number; text: string; done: boolean };
type TodoState = { todos: Todo[]; status: 'idle' | 'loading' | 'failed' };

const todoStore = withPlugins<TodoState>({ todos: [], status: 'idle' })
  .use('persist', persist({ key: 'todos' }))
  .use('history', history())
  .use({
    reducers: {
      addTodo: (state, text: string) => ({
        ...state,
        todos: [...state.todos, { id: Date.now(), text, done: false }],
      }),
      fetchStart:     (state) => ({ ...state, status: 'loading' }),
      fetchFulfilled: (state, todos: Todo[]) => ({ todos, status: 'idle' }),
      fetchRejected:  (state) => ({ ...state, status: 'failed' }),
    },

    middleware: (ctx, next) => {
      console.log('→', ctx.reducer.name, ctx.reducer.args);
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

todoStore.dispatch.addTodo('Buy groceries');
await todoStore.fetchTodos();
todoStore.history.undo();
```

## Two tiers of mutation

| Tier | How | When to use |
|---|---|---|
| `dispatch.*` | Routes through the middleware pipeline | State changes you want to log, trace, or cancel |
| `setState` | Bypasses the pipeline | Hard resets, plugin internals, intentional escape hatch |

Methods can use both: `dispatch.*` for traceable changes, `setState` when they need to escape the pipeline.

## Canceling a dispatch

Return `CANCELED` from a middleware to abort a dispatch without updating state:

```ts
import { CANCELED } from '@kin-store/core';

middleware: (ctx, next) => {
  if (!auth.isLoggedIn()) return CANCELED;
  return next();
},
```

## Namespaced plugins with reducers

Plugins can include their own reducers and methods, scoped under a namespace to prevent conflicts:

```ts
const todoStore = withPlugins({ todos: [] as string[] })
  .use('todos', {
    reducers: {
      add:   (state, text: string) => ({ todos: [...state.todos, text] }),
      clear: () => ({ todos: [] }),
    },
    methods: (store) => ({
      async fetch(): Promise<void> {
        const todos = await api.getTodos();
        store.dispatch.todos.add(todos[0]);
      },
    }),
  });

todoStore.dispatch.todos.add('Buy groceries');
todoStore.dispatch.todos.clear();
await todoStore.todos.fetch();
```

## Plugin options

A plugin passed to `.use()` is a plain object with any combination of:

| Field | Description |
|---|---|
| `reducers` | Pure functions `(state, ...args) => nextState` |
| `middleware` | `(ctx, next) => result` interceptor for all dispatches |
| `methods` | Factory `(store) => ({...})` returning methods added to the store |
| `onActivated` | Runs once immediately after the plugin is registered |
| `onDestroy` | Runs when `store.destroy()` is called |
