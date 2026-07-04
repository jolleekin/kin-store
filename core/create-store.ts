import { IS_STORE, notify } from "./_internals.ts";
import type { Listener } from "./_types.ts";

export type { Listener };

/**
 * A function passed to {@linkcode Store.set} that computes the next state
 * from the previous one, instead of replacing it outright.
 *
 * @template TState The type of the state being updated.
 *
 * @example
 * ```ts
 * const store = createStore(0);
 * const increment: Updater<number> = (n) => n + 1;
 * store.set(increment);
 * ```
 */
export type Updater<TState> = (prev: TState) => TState;

/**
 * The read-only surface of a {@linkcode Store}: `get` and `subscribe`, but
 * no `set`.
 *
 * APIs that only need to read a store — such as {@linkcode derive}'s
 * `get` helper or React's `useSelector` — should accept `ReadonlyStore` so both
 * plain and derived stores can be passed in.
 *
 * @template TState The type of the state held by this store.
 */
// deno-lint-ignore no-explicit-any
export type ReadonlyStore<TState = any> = {
  /**
   * Returns the current state of the store.
   */
  get(): TState;

  /**
   * Registers a listener that gets called when the state changes.
   *
   * Returns a function that can be called to unsubscribe the listener.
   *
   * @example
   * ```ts
   * const store = createStore({ count: 0 });
   *
   * const unsubscribe = store.subscribe((get, prevState) => {
   *   console.log("prev:", prevState.count, "next:", get().count);
   * });
   *
   * store.set({ count: 1 }); // logs: prev: 0 next: 1
   *
   * unsubscribe(); // stop listening
   * store.set({ count: 2 }); // no log
   * ```
   */
  subscribe(listener: Listener<TState>): VoidFunction;
};

/**
 * A reactive state container that holds a value of type `TState`.
 *
 * Use {@linkcode createStore} to create a plain store, or
 * {@linkcode withPlugins} to create one with reducer/middleware/method support.
 *
 * @example Basic usage
 * ```ts
 * const counter = createStore(0);
 *
 * counter.subscribe((get, prevState) => {
 *   console.log("changed from", prevState, "to", get());
 * });
 *
 * counter.set(1); // logs: changed from 0 to 1
 * counter.set((n) => n + 1); // logs: changed from 1 to 2
 * ```
 *
 * @template TState The type of the state held by this store.
 */
// deno-lint-ignore no-explicit-any
export type Store<TState = any> = ReadonlyStore<TState> & {
  /**
   * Sets the state of the store and notifies listeners.
   * @param next The next state or a function that computes the next state.
   *
   * **NOTE**:
   * This method completely bypasses the dispatch pipeline (if there is one).
   */
  set(next: TState | Updater<TState>): void;
};

/**
 * Creates a simple reactive state store.
 *
 * For stores that need reducers, middlewares, or methods, use
 * {@linkcode withPlugins} instead.
 *
 * @param initialState The initial state of the store.
 * @returns A {@linkcode Store} instance.
 *
 * @example Minimal store
 * ```ts
 * const store = createStore({ count: 0 });
 *
 * store.set({ count: 1 });
 * console.log(store.get()); // { count: 1 }
 * ```
 *
 * @example Functional update
 * ```ts
 * const store = createStore(0);
 * store.set((n) => n + 1);
 * console.log(store.get()); // 1
 * ```
 */
export function createStore<TState>(initialState: TState): Store<TState> {
  let state = initialState;
  const listeners = new Set<Listener<TState>>();

  function get(): TState {
    return state;
  }

  function set(next: TState | Updater<TState>): void {
    const prevState = state;

    state = typeof next === "function"
      ? (next as Updater<TState>)(prevState)
      : next;

    if (Object.is(state, prevState)) return;

    notify(listeners, get, prevState);
  }

  function subscribe(listener: Listener<TState>): VoidFunction {
    listeners.add(listener);
    return () => listeners.delete(listener);
  }

  return {
    [IS_STORE]: true,
    get,
    set,
    subscribe,
  } as Store<TState>;
}
