---
pageClass: comparison-page
---

# Comparison

The same todo store — `{ todos, status }` with `addTodo` and `fetchTodos` — implemented in each library. Full, working setup in every example.

## vs Redux / RTK

Redux requires an async thunk, a slice, and a configured store before you write a single line of app logic. Async actions are split across two concepts (thunk + extraReducers). TypeScript needs two manual type exports to flow through.

<SideBySide>

::: code-group

```ts [Redux / RTK]
import { createAsyncThunk, createSlice, configureStore } from '@reduxjs/toolkit';
import type { Middleware, PayloadAction } from '@reduxjs/toolkit';

type Todo = { id: number; text: string; done: boolean };
type TodoState = { todos: Todo[]; status: 'idle' | 'loading' | 'failed' };

// Async action must be defined separately from the slice that handles it.
const fetchTodos = createAsyncThunk('todos/fetch', async () => {
  const res = await fetch('/api/todos');
  return (await res.json()) as Todo[];
});

const todosSlice = createSlice({
  name: 'todos',
  initialState: { todos: [], status: 'idle' } as TodoState,
  reducers: {
    addTodo: (state, action: PayloadAction<string>) => {
      state.todos.push({ id: Date.now(), text: action.payload, done: false });
    },
  },
  // Async results are handled in a separate block from sync reducers.
  extraReducers: (builder) => {
    builder
      .addCase(fetchTodos.pending,   (s) => { s.status = 'loading'; })
      .addCase(fetchTodos.fulfilled, (s, a) => { s.todos = a.payload; s.status = 'idle'; })
      .addCase(fetchTodos.rejected,  (s) => { s.status = 'failed'; });
  },
});

// Middleware is a curried function — three layers of arrow functions.
const logger: Middleware = (api) => (next) => (action) => {
  console.log('dispatching', action);
  return next(action);
};

const store = configureStore({
  reducer: { todos: todosSlice.reducer },
  middleware: (m) => m().concat(logger),
});

// TypeScript requires these to be exported manually.
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Actions must be accessed through the slice object, not the store.
store.dispatch(todosSlice.actions.addTodo('Buy groceries'));
store.dispatch(fetchTodos()); // Returns a thunk, not a plain action.
```

```ts [Kin Store]
import { withPlugins } from '@kin-store/core';

type Todo = { id: number; text: string; done: boolean };
type TodoState = { todos: Todo[]; status: 'idle' | 'loading' | 'failed' };

// Sync and async live side-by-side — reducers for state changes,
// methods for orchestration. No separate thunk concept.
const todoStore = withPlugins<TodoState>({ todos: [], status: 'idle' })
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
      console.log('dispatching', ctx.reducer.name, ctx.reducer.args);
      return next();
    },
    methods: (store) => ({
      async fetchTodos(): Promise<void> {
        store.dispatch.fetchStart();
        try {
          const todos = await fetch('/api/todos').then(r => r.json()) as Todo[];
          store.dispatch.fetchFulfilled(todos);
        } catch {
          store.dispatch.fetchRejected();
        }
      },
    }),
  });

// Fully typed — no manual type exports needed.
todoStore.dispatch.addTodo('Buy groceries');
await todoStore.fetchTodos();
```

:::

</SideBySide>

**What's different:**

| | Redux / RTK | Kin Store |
|---|---|---|
| Async actions | `createAsyncThunk` + `extraReducers` | Method that calls reducers |
| Middleware | `(api) => (next) => (action) => ...` | `(ctx, next) => ...` |
| Type exports | `RootState`, `AppDispatch` manual exports | Fully inferred — zero exports |
| Access pattern | `slice.actions.addTodo(...)` | `store.dispatch.addTodo(...)` |

---

## vs Zustand

Zustand's middleware model nests each capability around the previous one — read right-to-left, outer wraps inner. State and actions live in the same object. Adding `persist` and `devtools` means three levels of nesting before you write any app logic.

<SideBySide>

::: code-group

```ts [Zustand]
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

type Todo = { id: number; text: string; done: boolean };

// State and actions must share one type — no structural separation.
type TodoStore = {
  todos: Todo[];
  status: 'idle' | 'loading' | 'failed';
  addTodo: (text: string) => void;
  fetchTodos: () => Promise<void>;
};

// Read inside-out: immer → persist → devtools.
// The order matters and affects what `set` does inside each wrapper.
const useStore = create<TodoStore>()(
  devtools(
    persist(
      immer((set) => ({
        todos: [],
        status: 'idle' as const,

        addTodo: (text: string) =>
          set((draft) => {
            // draft is Draft<TodoStore> — state and actions are the same object.
            // TypeScript loses the discriminated union on `status` inside Draft.
            draft.todos.push({ id: Date.now(), text, done: false });
          }),

        fetchTodos: async () => {
          set((draft) => { draft.status = 'loading'; });
          try {
            const todos = await fetch('/api/todos').then(r => r.json()) as Todo[];
            set((draft) => { draft.todos = todos; draft.status = 'idle'; });
          } catch {
            set((draft) => { draft.status = 'failed'; });
          }
        },
      })),
      { name: 'todos-storage' }, // persist config — nested here, not at the call site.
    ),
    { name: 'TodoStore' }, // devtools config — outermost wrapper.
  ),
);

// In React — subscribing to addTodo registers a watcher that fires on every
// state change, even though addTodo is a stable ref that never changes.
function TodoApp() {
  const todos      = useStore((s) => s.todos);
  const addTodo    = useStore((s) => s.addTodo);    // unnecessary subscription.
  const fetchTodos = useStore((s) => s.fetchTodos); // unnecessary subscription.
  // ...
}
```

```ts [Kin Store]
import { withPlugins } from '@kin-store/core';
import { persist, history } from '@kin-store/plugins';

type Todo = { id: number; text: string; done: boolean };
type TodoState = { todos: Todo[]; status: 'idle' | 'loading' | 'failed' };

// Read top-to-bottom — each .use() adds one line, not one nesting level.
const todoStore = withPlugins<TodoState>({ todos: [], status: 'idle' })
  .use('persist', persist({ key: 'todos-storage' }))
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
    methods: (store) => ({
      async fetchTodos(): Promise<void> {
        store.dispatch.fetchStart();
        try {
          const todos = await fetch('/api/todos').then(r => r.json()) as Todo[];
          store.dispatch.fetchFulfilled(todos);
        } catch {
          store.dispatch.fetchRejected();
        }
      },
    }),
  });

// Plugins are namespaced — no conflicts, no configuration buried in wrappers.
await todoStore.persist.hydrate();
todoStore.history.undo();

// In React — methods are stable refs, not part of the state subscription.
function TodoApp() {
  const todos = useSelector(todoStore, (s) => s.todos);
  // Call methods directly — no subscription, no re-render on action identity change.
  return <button onClick={() => todoStore.dispatch.addTodo('new')}>Add</button>;
}
```

:::

</SideBySide>

**What's different:**

| | Zustand | Kin Store |
|---|---|---|
| Adding persist | Wrap entire store in `persist(...)` | `.use('persist', persist(...))` |
| Adding devtools | Wrap again in `devtools(...)` | `.use('devtools', devtools(...))` *(planned)* |
| Reading pipeline order | Inside-out | Top-to-bottom |
| State vs actions | Same object | Structurally separate |
| Stable refs in React | Subscribe via selector | Call directly — zero subscriptions |
| `status` union in Immer | Lost inside `Draft<T>` | Fully preserved |

---

## vs Jotai

Jotai is atom-based — each piece of state is its own atom, and derived atoms compose them. It's a different model rather than a worse one, but it means thinking in atoms rather than in domains. Surprisingly, even actions are atoms — `atom(null, (get, set, arg) => ...)` is Jotai's way of expressing a write-only operation. Because every action is an atom, business logic can only be called inside React (via `useSetAtom`) unless you reach for the global store directly. When a write atom throws, the stack trace surfaces at the `useSetAtom` call site in your component, not at the atom definition — a chain of atoms triggering other atoms can be hard to follow in a debugger. For a simple app this trade-off may be acceptable; for a complex one, it gets messy fast and becomes a nightmare to debug.

<SideBySide>

::: code-group

```ts [Jotai]
import { atom, useAtomValue, useSetAtom } from 'jotai';

type Todo = { id: number; text: string; done: boolean };

// Each field is its own atom — no single "store" concept.
const todosAtom  = atom<Todo[]>([]);
const statusAtom = atom<'idle' | 'loading' | 'failed'>('idle');

// App logic must be wrapped in an atom.
const addTodoAtom = atom(null, (get, set, text: string) => {
  set(todosAtom, (prev) => [
    ...prev,
    { id: Date.now(), text, done: false },
  ]);
});

// Async logic requires write atoms or jotai-tanstack-query / atomWithQuery.
const fetchTodosAtom = atom(null, async (get, set) => {
  set(statusAtom, 'loading');
  try {
    const todos = await fetch('/api/todos').then(r => r.json()) as Todo[];
    set(todosAtom, todos);
    set(statusAtom, 'idle');
  } catch {
    set(statusAtom, 'failed');
  }
});

// Must use hooks to call write atoms — can't call them outside React.
function TodoApp() {
  const todos      = useAtomValue(todosAtom);
  const status     = useAtomValue(statusAtom);
  const addTodo    = useSetAtom(addTodoAtom);
  const fetchTodos = useSetAtom(fetchTodosAtom);
  // ...
}
```

```ts [Kin Store]
import { createStore } from '@kin-store/core';
import { useSelector } from '@kin-store/react';

type Todo = { id: number; text: string; done: boolean };
type TodoState = { todos: Todo[]; status: 'idle' | 'loading' | 'failed' };

// One store, one domain — compose with derive when you need cross-store views.
const todoStore = createStore<TodoState>({ todos: [], status: 'idle' });

function addTodo(text: string): void {
  todoStore.setState((s) => ({
    ...s,
    todos: [...s.todos, { id: Date.now(), text, done: false }],
  }));
}

async function fetchTodos(): Promise<void> {
  todoStore.setState((s) => ({ ...s, status: 'loading' }));
  try {
    const todos = await fetch('/api/todos').then(r => r.json()) as Todo[];
    todoStore.setState({ todos, status: 'idle' });
  } catch {
    todoStore.setState((s) => ({ ...s, status: 'failed' }));
  }
}

// Logic works outside React — no hook required.
await fetchTodos();
addTodo('Buy groceries');

// React subscription is opt-in via useSelector.
function TodoApp() {
  const todos  = useSelector(todoStore, (s) => s.todos);
  const status = useSelector(todoStore, (s) => s.status);
  // ...
}
```

:::

</SideBySide>

**What's different:**

| | Jotai | Kin Store |
|---|---|---|
| State model | Atoms | Stores (value + subscribers) |
| Async logic | Write atoms or external library | Plain async methods |
| Call actions outside React | Not directly | Yes — plain functions or methods |
| Reactive composition | Derived atoms | `derive((get) => ...)` |
| Mental model | "think in atoms" | "think in domains" |

---

## vs MobX

MobX uses a proxy-based reactive system: `makeAutoObservable` silently instruments every property and method on your class, turning fields into observables, getters into computeds, and methods into actions. This feels magical at first — mutations just work. The cost shows up later: async methods require `runInAction` to keep the reactive graph consistent (forgetting it causes silent stale-data bugs), every React component that reads observable state must be wrapped in `observer()` (forgetting it also causes silent stale-data bugs with no error thrown), and when a computed unexpectedly re-runs you have to reverse-engineer the reactive graph to find out why. At 16 KB gzipped, it is also the heaviest option in this list.

<SideBySide>

::: code-group

```ts [MobX]
import { makeAutoObservable, runInAction } from 'mobx';
import { observer } from 'mobx-react-lite';

type Todo = { id: number; text: string; done: boolean };

class TodoStore {
  todos: Todo[] = [];
  status: 'idle' | 'loading' | 'failed' = 'idle';

  constructor() {
    // Instruments every field and method — no explicit list of what is reactive.
    makeAutoObservable(this);
  }

  addTodo(text: string) {
    this.todos.push({ id: Date.now(), text, done: false });
  }

  async fetchTodos() {
    this.status = 'loading';
    try {
      const todos = await fetch('/api/todos').then(r => r.json()) as Todo[];
      // Mutations after an await must be wrapped in runInAction.
      // Forgetting this causes silent stale-data bugs — no error, wrong UI.
      runInAction(() => {
        this.todos = todos;
        this.status = 'idle';
      });
    } catch {
      runInAction(() => { this.status = 'failed'; });
    }
  }
}

export const todoStore = new TodoStore();

// Every component that reads observable state must be wrapped in observer().
// Forgetting observer() also causes silent stale-data bugs — no error thrown.
const TodoApp = observer(() => {
  const { todos, status } = todoStore;
  return (
    <button onClick={() => todoStore.addTodo('Buy groceries')}>Add</button>
  );
});
```

```ts [Kin Store]
import { withPlugins } from '@kin-store/core';
import { useSelector } from '@kin-store/react';

type Todo = { id: number; text: string; done: boolean };
type TodoState = { todos: Todo[]; status: 'idle' | 'loading' | 'failed' };

// Plain object — no class, no proxy, no instrumentation.
const todoStore = withPlugins<TodoState>({ todos: [], status: 'idle' })
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
    methods: (store) => ({
      async fetchTodos(): Promise<void> {
        store.dispatch.fetchStart();
        try {
          const todos = await fetch('/api/todos').then(r => r.json()) as Todo[];
          // No runInAction needed — state updates are always explicit dispatches.
          store.dispatch.fetchFulfilled(todos);
        } catch {
          store.dispatch.fetchRejected();
        }
      },
    }),
  });

// No observer() wrapper — subscriptions are opt-in and explicit.
function TodoApp() {
  const todos = useSelector(todoStore, (s) => s.todos);
  return (
    <button onClick={() => todoStore.dispatch.addTodo('Buy groceries')}>Add</button>
  );
}
```

:::

</SideBySide>

**What's different:**

| | MobX | Kin Store |
|---|---|---|
| State mutations | Mutable (proxy-intercepted) | Immutable reducers |
| Async updates | Must wrap in `runInAction` | Plain dispatches — no wrapper |
| React integration | `observer()` on every component | `useSelector` only where needed |
| Class required | Yes (or `observable({...})`) | No — plain object |
| Reactive graph | Implicit, auto-tracked | Explicit via `derive` |
| Silent stale-data bugs | Two sources (`runInAction`, `observer`) | None |
| Bundle | ~16 KB | 244 B – 1.07 KB |

---

## Bundle size

| Package                                                    | Minified + gzip |
| ---------------------------------------------------------- | --------------- |
| **`@kin-store/core`**                                      | —               |
| &nbsp;&nbsp;↳ `createStore` alone                          | **244 B**       |
| &nbsp;&nbsp;↳ `derive` alone                               | **465 B**       |
| &nbsp;&nbsp;↳ `withPlugins` (full plugin system)           | **1.07 KB**     |
| `zustand` core                                             | ~1.2 KB         |
| `jotai` core                                               | ~3.5 KB         |
| `@reduxjs/toolkit`                                         | ~11 KB          |
| `mobx`                                                     | ~16 KB          |

Kin Store is pay-per-use: import only `createStore` and pay 244 B. Import `withPlugins` and pay 1.07 KB. The plugin bundles (`persist`, `history`, `immer`) add only what you import.
