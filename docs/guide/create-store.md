# createStore

The irreducible floor. A value and three methods.

```ts
import { createStore } from '@kin-store/core';
```

## Basic usage

```ts
type TodoState = { todos: string[]; status: 'idle' | 'loading' | 'failed' };

const store = createStore({ todos: [], status: 'idle' } as TodoState);
```

`createStore` holds any value and returns an object with three methods: `getState`, `setState`, and `subscribe`. Logic lives in plain top-level functions — no dispatch, no action types.

```ts
function addTodo(text: string): void {
  store.setState((s) => ({ ...s, todos: [...s.todos, text] }));
}

async function fetchTodos(): Promise<void> {
  store.setState((s) => ({ ...s, status: 'loading' }));
  try {
    const todos = await api.getTodos();
    store.setState({ todos, status: 'idle' });
  } catch {
    store.setState((s) => ({ ...s, status: 'failed' }));
  }
}

addTodo('Hello world');
console.log(store.getState()); // { todos: ['Hello world'], status: 'idle' }
```

## API

### `getState()`

Reads the current state synchronously. Always returns the latest value.

```ts
const { todos } = store.getState();
```

### `setState(nextState)`

Accepts a new value or an updater function. Notifies all subscribers.

```ts
// Replace the whole state.
store.setState({ todos: [], status: 'idle' });

// Merge via updater (the idiomatic pattern — avoids stale closures).
store.setState((s) => ({ ...s, todos: [...s.todos, 'new item'] }));
```

### `subscribe(listener)`

Fires on every state change. Returns an unsubscribe function.

```ts
const unsubscribe = store.subscribe((getState, prevState) => {
  console.log(prevState, '->', getState());
});

// Stop listening.
unsubscribe();
```

The listener receives `getState` (a getter, not the value itself) and `prevState` (the state before the change). Using a getter prevents you from accidentally closing over a stale snapshot.

## `listenerWithSelector`

Wraps a listener so it only fires when a selected slice of the state changes. Useful for subscribing to a store outside of React without unnecessary re-runs.

```ts
import { listenerWithSelector } from '@kin-store/core';

const store = createStore({ count: 0, name: 'Alice' });

store.subscribe(
  listenerWithSelector(
    (getSlice, prevSlice) => console.log('count:', prevSlice, '->', getSlice()),
    (state) => state.count,
  ),
);

store.setState({ count: 1, name: 'Alice' }); // logs: count: 0 -> 1
store.setState({ count: 1, name: 'Bob' });   // no log — count didn't change
```

## When to use createStore

`createStore` is the right choice when:

- You want the minimal API with no overhead
- Logic is small enough to live in module-level functions
- You're building a library or utility on top of kin-store

When you need methods colocated with the store, a dispatch pipeline, or middleware — reach for [`withPlugins`](/guide/with-plugins).
