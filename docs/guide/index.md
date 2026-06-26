# Why Kin Store?

Every major state library made a tradeoff you could live with. Until you
couldn't.

## The Redux problem

Redux is thorough. It's also ceremonious. A "simple store" with one async
action, one slice, and one logging middleware already demands dozens of lines of
boilerplate just to wire it up:

```ts
type Todo = { id: number; text: string; done: boolean };
type TodoState = { todos: Todo[]; status: "idle" | "loading" | "failed" };

// 1. Async thunk.
const fetchTodos = createAsyncThunk("todos/fetch", async () => {
  const res = await fetch("/api/todos");
  return (await resp.json()) as Todo[];
});

// 2. Slice.
const todosSlice = createSlice({
  name: "todos",
  initialState: { todos: [], status: "idle" } as TodoState,
  reducers: {
    addTodo: (state, action: PayloadAction<string>) => {
      state.todos.push({ id: Date.now(), text: action.payload, done: false });
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTodos.pending, (s) => {
        s.status = "loading";
      })
      .addCase(fetchTodos.fulfilled, (s, a) => {
        s.todos = a.payload;
        s.status = "idle";
      })
      .addCase(fetchTodos.rejected, (s) => {
        s.status = "failed";
      });
  },
});

// 3. Middleware.
const logger: Middleware = (api) => (next) => (action) => {
  console.log("dispatching", action);
  return next(action);
};

// 4. Assemble.
const store = configureStore({
  reducer: { todos: todosSlice.reducer },
  middleware: (m) => m().concat(logger),
});

// TypeScript requires these to be exported manually.
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
```

The structure becomes harder to reason about than the problem it's solving.

## The Zustand problem

Zustand is lighter. But mixing state and actions in one object creates real
issues:

```ts
const useStore = create(
  devtools(
    persist(
      immer<State & Actions>((set) => ({
        todos: [],
        status: "idle",
        addTodo: (text: string) =>
          set((draft) => {
            draft.todos.push(text); // `draft` is `any` — no type safety.
          }),
        async fetch() {
          set((draft) => {
            draft.status = "loading";
          });
          const todos = await api.getTodos();
          set({ todos, status: "idle" });
        },
      })),
      { name: "todos" },
    ),
    { name: "TodoStore" },
  ),
);
```

Five specific problems:

1. **No type safety** — `state` inside the immer callback is `any`. TypeScript
   can't help you here.
2. **State and actions are indistinguishable** — `todos` (data) and `addTodo` (a
   command) live in the same object. You can't tell from the type alone what's
   state and what's behavior.
3. **Stable refs through subscriptions** — `addTodo` is stable and will never
   change, yet `useStore(s => s.addTodo)` registers a subscription that runs on
   every state update, forever.
4. **Inside-out middleware pipeline** — `devtools(persist(immer(...)))` reads
   left-to-right but executes right-to-left. You must mentally invert the
   nesting to understand execution order.
5. **Unpredictable API shape** — each middleware wraps the store itself and can
   alter its API. What `set` does depends on composition order.

## The Jotai problem

Jotai replaces a central store with a graph of atoms. State is fine. But logic
gets awkward fast:

```ts
import { atom, useAtomValue, useSetAtom } from "jotai";

const todosAtom = atom<Todo[]>([]);
const statusAtom = atom<"idle" | "loading" | "failed">("idle");

// App logic must be wrapped in an atom — no plain function allowed.
const addTodoAtom = atom(null, (get, set, text: string) => {
  set(todosAtom, (prev) => [
    ...prev,
    { id: Date.now(), text, done: false },
  ]);
});
const fetchTodosAtom = atom(null, async (get, set) => {
  set(statusAtom, "loading");
  try {
    const todos = await fetch("/api/todos").then((r) => r.json()) as Todo[];
    set(todosAtom, todos);
    set(statusAtom, "idle");
  } catch {
    set(statusAtom, "failed");
  }
});
// Must use hooks to call write atoms — can't call from outside React.
function TodoApp() {
  const todos = useAtomValue(todosAtom);
  const status = useAtomValue(statusAtom);
  const addTodo = useSetAtom(addTodoAtom);
  const fetchTodos = useSetAtom(fetchTodosAtom);
}
```

Three specific problems:

1. **Actions must be atoms** — Even a simple `addTodo` must be wrapped in
   `atom(null, (get, set, arg) => ...)`. Every piece of logic is a write atom —
   there is no plain function style.
2. **Logic can't run outside React** — Write atoms are activated via
   `useSetAtom`. You can't call them from a service layer, a test, or a timeout
   without reaching for `getDefaultStore()`.
3. **Hard to debug at scale** — Stack traces surface at the `useSetAtom` call
   site in your component — not at the atom definition. A chain of atoms
   triggering other atoms is hard to trace in a debugger.

## The MobX problem

MobX is the most ergonomic of the bunch. But it trades transparency for magic:

```tsx
class TodoStore {
  todos: Todo[] = [];
  status: "idle" | "loading" | "failed" = "idle";

  constructor() {
    makeAutoObservable(this);
  }

  addTodo(text: string) {
    this.todos.push({ id: Date.now(), text, done: false });
  }

  async fetchTodos() {
    this.status = "loading";
    try {
      const todos = await fetch("/api/todos").then((r) => r.json()) as Todo[];
      runInAction(() => {
        this.todos = todos;
        this.status = "idle";
      });
    } catch {
      runInAction(() => {
        this.status = "failed";
      });
    }
  }
}

const todoStore = new TodoStore();

const TodoApp = observer(() => {
  const { todos, status } = todoStore;
  return (
    <button onClick={() => todoStore.addTodo("Buy groceries")}>Add</button>
  );
});
```

Three specific problems:

1. **`makeAutoObservable` magic** — Instruments every field and method invisibly
   — fields become observables, getters become computeds, methods become
   actions. No explicit list of what is reactive vs. not.
2. **`runInAction` required in async** — Mutations after an `await` must be
   wrapped in `runInAction()`. Forgetting causes silent stale-data bugs — no
   error is thrown, the UI just shows wrong data.
3. **`observer()` on every component** — Every component reading observable
   state must be wrapped in `observer()`. Forgetting also causes silent
   stale-data bugs — still no error thrown. Two silent failure modes.

## Can we do better?

What if we had:

- **Structure** — without the ceremony
- **Zero boilerplate** — or as close as possible
- **100% type-safe** — by default, not as an afterthought
- **No hidden cost** — pay only for what you use
- **Opt-in complexity** — that composes linearly, not exponentially

That's Kin Store.

## Three primitives. Each composable. None mandatory.

| Primitive                            | What it does                                                                          |
| ------------------------------------ | ------------------------------------------------------------------------------------- |
| [`createStore`](/guide/create-store) | The irreducible floor. `get` · `set` · `subscribe`. Nothing else.                     |
| [`withPlugins`](/guide/with-plugins) | Opt-in structure: methods, reducers, middleware, lifecycle hooks, namespaced plugins. |
| [`derive`](/guide/derive)            | Lazy, dependency-tracked, read-only views composed from one or more stores.           |

Each is additive. You never undo what you built.
