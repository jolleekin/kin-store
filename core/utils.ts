import type { Listener } from "./_types.ts";
import type {
  InferActions,
  NestedMethods,
  NestedReducers,
  Reducers,
  StoreWithPlugins,
} from "./with-plugins.ts";

/**
 * Wraps a {@linkcode Listener} so that it only fires when a selected slice of
 * the state changes, rather than on every state update.
 *
 * The slice is extracted by `selector` on each state change. The listener is
 * only called when `equal` returns `false` for the previous and next slices.
 * By default, `Object.is` is used for equality comparison.
 *
 * This utility is available for use in any context where you need to narrow
 * a broad {@linkcode Listener} down to a specific slice — for example when
 * subscribing to a store outside of React.
 *
 * @template TState The full state type of the store being subscribed to.
 * @template TSlice The type of the selected slice the listener cares about.
 *
 * @param listener The narrowed listener to wrap. It will be called with the
 * selected slice's getter and previous slice.
 * @param selector A function that picks the slice of interest from the full
 * state.
 * @param options.equal An optional custom equality function. Defaults to
 * `Object.is`.
 * @returns A new {@linkcode Listener} for `TState` that internally filters by
 * the selected slice.
 *
 * @example Subscribing only to a counter inside a larger state
 * ```ts
 * const store = createStore({ count: 0, name: "Alice" });
 *
 * const listener = listenerWithSelector(
 *   (getSlice, prevSlice) => {
 *     console.log("count changed:", prevSlice, "->", getSlice());
 *   },
 *   (state) => state.count,
 * );
 *
 * store.subscribe(listener);
 *
 * store.setState({ count: 1, name: "Alice" }); // logs: count changed: 0 -> 1
 * store.setState({ count: 1, name: "Bob" });   // no log (count unchanged)
 * ```
 *
 * @example Using a custom equality function for arrays
 * ```ts
 * const listener = listenerWithSelector(
 *   (getSlice) => console.log("items:", getSlice()),
 *   (state) => state.items,
 *   { equal: (a, b) => JSON.stringify(a) === JSON.stringify(b) },
 * );
 * ```
 */
export function listenerWithSelector<TState, TSlice>(
  listener: Listener<TSlice>,
  selector: (state: TState) => TSlice,
  options: { equal?: (prevSlice: TSlice, nextSlice: TSlice) => boolean } = {},
): Listener<TState> {
  const { equal = Object.is } = options;

  let slice: TSlice | undefined;

  function getSlice(): TSlice {
    return slice!;
  }

  return (getState, prevState) => {
    const nextSlice = selector(getState());

    if (slice === undefined) slice = selector(prevState);

    if (!equal(slice, nextSlice)) {
      const prevSlice = slice;
      slice = nextSlice;
      listener(getSlice, prevSlice);
    }
  };
}

/**
 * Returns the correctly-typed dispatch object for a plugin's own reducers.
 *
 * When a plugin is registered under a namespace, its actions live at
 * `store.dispatch[namespace]`. For top-level plugins they live directly on
 * `store.dispatch`. This helper resolves the right target and narrows the type
 * so callers can invoke the plugin's internal actions without casting.
 *
 * Typically used inside {@linkcode import("./with-plugins.ts").StorePlugin.methods methods},
 * {@linkcode import("./with-plugins.ts").StorePlugin.onActivated onActivated}, and
 * {@linkcode import("./with-plugins.ts").StorePlugin.onDestroy onDestroy} to
 * access the plugin's own reducers:
 *
 * ```ts
 * methods: (store, { namespace }) => {
 *   const dispatch = getPluginDispatch(store, namespace);
 *   return {
 *     undo(): void {
 *       dispatch._restore(previousState);
 *     },
 *   };
 * }
 * ```
 *
 * @template TState The store's state type.
 * @template TStoreReducers The reducers registered on the store.
 * @template TStoreMethods The methods registered on the store.
 * @template TNamespace The plugin's namespace, or `undefined` for top-level.
 *
 * @param store The store passed to the plugin callback.
 * @param namespace The namespace the plugin was registered under, or
 * `undefined` for top-level plugins. Pass the `namespace` from
 * {@linkcode import("./with-plugins.ts").PluginContext PluginContext} directly.
 *
 * @remarks
 * The return type is necessarily wide. Cast the result to
 * `InferActions<TState, TPluginReducers>` — where `TPluginReducers` is your
 * plugin's own reducers type — to get fully-typed action callers.
 */
export function getPluginDispatch<
  TState,
  TStoreReducers extends NestedReducers<TState>,
  TStoreMethods extends NestedMethods,
  TNamespace extends string | undefined,
>(
  store: StoreWithPlugins<TState, TStoreReducers, TStoreMethods>,
  namespace: TNamespace,
): TNamespace extends keyof TStoreReducers
  ? TStoreReducers[TNamespace] extends Reducers<TState>
    ? InferActions<TState, TStoreReducers[TNamespace]>
  : InferActions<TState, TStoreReducers>
  : InferActions<TState, TStoreReducers> {
  return namespace
    // deno-lint-ignore no-explicit-any
    ? (store.dispatch as any)[namespace]
    // deno-lint-ignore no-explicit-any
    : (store.dispatch as any);
}
