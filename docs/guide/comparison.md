# Comparison

How Kin Store compares to the most popular state libraries.

## Feature matrix

|                           | Kin Store | Zustand | Redux / RTK | Jotai | MobX |
| ------------------------- | :-------: | :-----: | :---------: | :---: | :--: |
| Zero dependencies         |    ✅     |   ✅    |     ❌      |  ✅   |  ❌  |
| Tiny footprint            |    ✅     |   ✅    |     ❌      |  ✅   |  ❌  |
| 100% type-safe            |    ✅     |   ⚠️    |     ⚠️      |  ✅   |  ⚠️  |
| Linear plugin composition |    ✅     |   ❌    |     ❌      |   —   |  —   |
| Separate state and logic  |    ✅     |   ❌    |     ✅      |   —   |  ✅  |
| Opt-in complexity         |    ✅     |   ❌    |     ❌      |  ✅   |  ❌  |
| No hidden magic           |    ✅     |   ✅    |     ✅      |  ⚠️   |  ❌  |
| Reactive composition      |    ✅     |   ❌    |     ❌      |  ✅   |  ✅  |

## Kin Store vs Zustand

The most direct comparison. Both are small and framework-agnostic. The differences are in type safety and plugin model.

**Zustand** — inside-out middleware nesting, state and actions in one object, type inference gaps with `immer`:

```ts
const useStore = create<State & Actions>()(
  devtools(
    persist(
      immer((set) => ({
        // `set` type varies by middleware order
        todos: [],
        addTodo: (text) =>
          set((draft) => {
            draft.todos.push(text); // draft is `any` without explicit type
          }),
      })),
      { name: "todos" },
    ),
  ),
);
```

**Kin Store** — flat `.use()` chaining, state separate from methods, fully inferred:

```ts
const store = withPlugins({ todos: [] as string[] })
  .use("persist", persist({ key: "todos" })) // each line adds one thing
  .use({
    methods: (store) => ({
      addTodo(text: string): void {
        // fully typed — no annotation needed
        store.setState((s) => ({ ...s, todos: [...s.todos, text] }));
      },
    }),
  });
```

## Kin Store vs Redux / RTK

Redux is the most structured option. Kin Store borrows the dispatcher pattern when you need it, without requiring it when you don't.

**Redux** — always uses slices, always uses a dispatch pipeline, always requires boilerplate:

```ts
// Can't skip reducers or the action type system even for simple state
const slice = createSlice({ name: 'todos', initialState, reducers: { add: ... } })
store.dispatch(slice.actions.add('hello'))
```

**Kin Store** — dispatch is opt-in:

```ts
// Simple style — plain functions, no dispatch:
const store = createStore({ todos: [] });
function addTodo(text) {
  store.setState((s) => ({ ...s, todos: [...s.todos, text] }));
}

// Redux style — reducers + dispatch, only when you want it:
const store = withPlugins({ todos: [] }).use({
  reducers: {
    add: (state, text) => ({ ...state, todos: [...state.todos, text] }),
  },
});
store.dispatch.add("hello");
```

## Kin Store vs Jotai

Both support reactive composition. Jotai uses atoms; Kin Store uses `derive` over regular stores.

**Jotai** — atomic model where each piece of state is a separate atom:

```ts
const todosAtom = atom<string[]>([]);
const countAtom = atom((get) => get(todosAtom).length);

function useTodos() {
  const [todos, setTodos] = useAtom(todosAtom);
  const count = useAtomValue(countAtom);
  return { todos, count, addTodo: (t) => setTodos((p) => [...p, t]) };
}
```

**Kin Store** — stores hold structured state; `derive` composes across them:

```ts
const todoStore = createStore({ todos: [] as string[] });
const count = derive((get) => get(todoStore).todos.length);

// Or with React:
const count = useSelector(todoStore, (s) => s.todos.length);
```

Kin Store's model stays closer to how you'd model the domain. You don't need to think in atoms — a store is just a value with subscribers.

## Bundle size

| Package                            | Minified + gzip |
| ---------------------------------- | --------------- |
| `createStore` alone                | **244 B**       |
| `derive` alone                     | **465 B**       |
| `withPlugins` (full plugin system) | **1.07 KB**     |
| `zustand` core                     | ~1.2 KB         |
| `jotai` core                       | ~3.5 KB         |
| `@reduxjs/toolkit`                 | ~11 KB          |
| `mobx`                             | ~16 KB          |
