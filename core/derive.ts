import { notify, throwError } from "./_internals.ts";
import type { Listener, Store } from "./create-store.ts";

type Getter = <T>(store: Store<T>) => T;

type ComputeFn<TState> = (
  get: Getter,
  prev: () => TState | undefined,
) => TState;

/**
 * A read-only store whose value is computed from one or more source stores.
 *
 * Dependencies are tracked automatically: every source store passed to `get`
 * inside the compute function becomes a dependency. The derived value is
 * recomputed lazily whenever any dependency changes.
 *
 * Use {@linkcode derive} to create a `DerivedStore`.
 *
 * @template TState The type of the derived value.
 */
export type DerivedStore<TState> =
  & Pick<
    Store<TState>,
    "getState" | "subscribe"
  >
  & {
    /**
     * Destroys the store, removing all listeners and all dependencies.
     *
     * It's safe to call `destroy() more than once. However, calling other
     * methods will throw an error after calling `destroy()`.
     */
    destroy(): void;
  };

/**
 * Creates a read-only store whose value is computed from other stores.
 *
 * Dependencies are discovered automatically the first time `getState` is
 * called (or the first subscriber registers). After that, the derived value is
 * kept in sync reactively — it is recomputed lazily only when a dependency
 * actually changes.
 *
 * When there are no subscribers, the derived store is "cold": subscriptions to
 * source stores are dropped and the cached value is discarded. They are
 * re-established the next time a subscriber registers.
 *
 * @template TState The type of the derived value.
 *
 * @param compute A pure function that receives two helpers and returns the
 * derived value.
 *
 * - `get(sourceStore)` — reads a source store's current state and registers
 *   it as a dependency. Every store passed to `get` inside a single
 *   recompute becomes a tracked dependency for that run.
 * - `prev()` — returns the derived store's **previous** computed value
 *   (`undefined` on the very first computation). Use this to build
 *   accumulators or smoothing functions that incorporate their own prior
 *   output.
 *
 *   > **Note:** Because `prev` carries `TState` in its return type,
 *   > TypeScript cannot infer `TState` from the return expression when
 *   > `prev()` is used. Supply an explicit type parameter in that case:
 *   > `derive<number>((get, prev) => ...)`.
 *
 * @returns A {@linkcode DerivedStore} whose `getState` returns the computed
 * value.
 *
 * @example Deriving from a single store
 * ```ts
 * const counter = createStore(2);
 * const doubled = derive((get) => get(counter) * 2);
 *
 * console.log(doubled.getState()); // 4
 *
 * counter.setState(5);
 * console.log(doubled.getState()); // 10
 * ```
 *
 * @example Deriving from multiple stores
 * ```ts
 * const firstName = createStore("Ada");
 * const lastName = createStore("Lovelace");
 *
 * const fullName = derive(
 *   (get) => `${get(firstName)} ${get(lastName)}`,
 * );
 *
 * console.log(fullName.getState()); // "Ada Lovelace"
 *
 * lastName.setState("Byron");
 * console.log(fullName.getState()); // "Ada Byron"
 * ```
 *
 * @example Conditional dependencies — only the active branch is tracked
 * ```ts
 * const toggle = createStore(true);
 * const a = createStore("A");
 * const b = createStore("B");
 *
 * // When toggle is true the derived store only depends on `toggle` and `a`.
 * // Changing `b` will NOT trigger a recompute.
 * const result = derive((get) => get(toggle) ? get(a) : get(b));
 * ```
 *
 * @example Subscribing to changes
 * ```ts
 * const price = createStore(100);
 * const taxed = derive((get) => get(price) * 1.2);
 *
 * const unsubscribe = taxed.subscribe((getState, prevState) => {
 *   console.log("price changed:", prevState, "->", getState());
 * });
 *
 * price.setState(200); // logs: price changed: 120 -> 240
 * unsubscribe();
 * ```
 *
 * @example Using `prev` to accumulate values (explicit type required)
 * ```ts
 * const delta = createStore(1);
 *
 * // Accumulates each delta into a running total.
 * const total = derive<number>((get, prev) => (prev() ?? 0) + get(delta));
 *
 * total.subscribe((getState) => console.log(getState()));
 *
 * delta.setState(5); // logs: 6  (0 + 1 + 5)
 * delta.setState(3); // logs: 9  (6 + 3)
 * ```
 *
 * @see {@link https://github.com/zustandjs/derive-zustand} — original inspiration
 */
export function derive<TState>(
  compute: ComputeFn<TState>,
): DerivedStore<TState> {
  let state: TState | undefined;
  let isInvalidated = true;
  let isDestroyed = false;
  let dependencies: Map<Store, unknown> | undefined;
  const listeners = new Set<Listener<TState>>();
  const subscriptions = new Map<Store, VoidFunction>();

  function checkDestroyed(): void | never {
    if (isDestroyed) throwError("The store has been destroyed");
  }

  function invalidate(): void {
    if (isInvalidated) return;

    isInvalidated = true;
    notify(listeners, getState, state!);
  }

  function anyDependencyChanged(): boolean {
    for (const store of dependencies!.keys()) {
      if (!Object.is(store.getState(), dependencies!.get(store))) return true;
    }

    return false;
  }

  function getState(): TState {
    checkDestroyed();

    if (!isInvalidated) return state!;

    if (!dependencies || anyDependencyChanged()) {
      const newDependencies = new Map<Store, unknown>();

      const get: Getter = <T>(store: Store<T>) => {
        const s = store.getState();
        newDependencies.set(store, s);
        return s;
      };

      state = compute(get, () => state);
      dependencies = newDependencies;
    }

    if (listeners.size > 0) {
      // Remove unneeded subscriptions.
      for (const store of subscriptions.keys()) {
        if (!dependencies.has(store)) {
          subscriptions.get(store)!();
          subscriptions.delete(store);
        }
      }

      // Add new subscriptions.
      for (const store of dependencies.keys()) {
        if (!subscriptions.has(store)) {
          subscriptions.set(store, store.subscribe(invalidate));
        }
      }

      isInvalidated = false;
    }

    return state!;
  }

  function subscribe(listener: Listener<TState>): VoidFunction {
    checkDestroyed();

    listeners.add(listener);

    // Trigger read to establish dependencies if this is the first subscriber.
    if (listeners.size === 1) getState();

    return () => {
      listeners.delete(listener);
      if (listeners.size === 0) clearDependencies();
    };
  }

  function clearDependencies(): void {
    for (const unsubscribe of subscriptions.values()) unsubscribe();
    subscriptions.clear();
    dependencies = undefined;
    isInvalidated = true;
  }

  function destroy(): void {
    checkDestroyed();

    listeners.clear();
    clearDependencies();
    isDestroyed = true;
  }

  return {
    getState,
    subscribe,
    destroy,
  };
}
