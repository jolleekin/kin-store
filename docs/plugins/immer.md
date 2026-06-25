# immer

Write reducers (and `setState` calls) as [Immer](https://immerjs.github.io/immer/) draft mutations instead of returning new state objects.

## Basic usage

```ts
import { withPlugins } from '@kin-store/core';
import { immer } from '@kin-store/plugins';

const store = withPlugins({ count: 0, items: [] as string[] })
  .use(immer({
    reducers: {
      increment(draft, amount: number): void {
        draft.count += amount;
      },
      addItem(draft, item: string): void {
        draft.items.push(item);
      },
    },
    methods: (store) => ({
      reset(): void {
        store.setState((draft) => {
          draft.count = 0;
          draft.items = [];
        });
      },
    }),
  }));

store.dispatch.increment(5);
store.dispatch.addItem('hello');
store.reset();
```

The `immer()` wrapper accepts the same fields as a standard `StorePlugin`: `reducers`, `middleware`, `methods`, `onActivated`, and `onDestroy`. Inside those callbacks, reducers mutate a draft instead of returning a new object, and `setState` accepts a recipe `(draft) => void` instead of a full state replacement.

## With namespacing

`immer` can also be applied as a namespaced plugin:

```ts
const store = withPlugins({ todos: [] as string[] })
  .use('todos', immer({
    reducers: {
      add: (draft, text: string) => { draft.todos.push(text); },
      clear: (draft) => { draft.todos = []; },
    },
  }));

store.dispatch.todos.add('hello');
store.dispatch.todos.clear();
```

## Note on type inference

Because Immer mutates a draft in-place (void return), reducers written with `immer` do not need to return a value. TypeScript fully infers argument types from the reducer signature.
