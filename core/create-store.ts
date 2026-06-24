import { IS_STORE, notify } from "./_internals.ts";
import type { Listener } from "./_types.ts";

export type { Listener };

type SetStateCallback<TState> = (prevState: TState) => TState;

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
 * counter.subscribe((getState, prevState) => {
 *   console.log("changed from", prevState, "to", getState());
 * });
 *
 * counter.setState(1); // logs: changed from 0 to 1
 * counter.setState((n) => n + 1); // logs: changed from 1 to 2
 * ```
 *
 * @template TState The type of the state held by this store.
 */
// deno-lint-ignore no-explicit-any
export type Store<TState = any> = {
  /**
   * Returns the current state of the store.
   */
  getState(): TState;

  /**
   * Sets the state of the store and notifies listeners.
   * @param next The next state or a function that computes the next state.
   *
   * **NOTE**:
   * This method completely bypasses the dispatch pipeline (if there is one).
   */
  setState(next: TState | SetStateCallback<TState>): void;

  /**
   * Registers a listener that gets called when the state changes.
   *
   * Returns a function that can be called to unsubscribe the listener.
   *
   * @example
   * ```ts
   * const store = createStore({ count: 0 });
   *
   * const unsubscribe = store.subscribe((getState, prevState) => {
   *   console.log("prev:", prevState.count, "next:", getState().count);
   * });
   *
   * store.setState({ count: 1 }); // logs: prev: 0 next: 1
   *
   * unsubscribe(); // stop listening
   * store.setState({ count: 2 }); // no log
   * ```
   */
  subscribe(listener: Listener<TState>): VoidFunction;
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
 * store.setState({ count: 1 });
 * console.log(store.getState()); // { count: 1 }
 * ```
 *
 * @example Functional update
 * ```ts
 * const store = createStore(0);
 * store.setState((n) => n + 1);
 * console.log(store.getState()); // 1
 * ```
 */
export function createStore<TState>(initialState: TState): Store<TState> {
  let state = initialState;
  const listeners = new Set<Listener<TState>>();

  function getState(): TState {
    return state;
  }

  function setState(next: TState | SetStateCallback<TState>): void {
    const prevState = state;

    state =
      typeof next === "function"
        ? (next as SetStateCallback<TState>)(prevState)
        : next;

    if (Object.is(state, prevState)) return;

    notify(listeners, getState, prevState);
  }

  function subscribe(listener: Listener<TState>): VoidFunction {
    listeners.add(listener);

    return () => listeners.delete(listener);
  }

  return {
    [IS_STORE]: true,
    getState,
    setState,
    subscribe,
  } as Store<TState>;
}
