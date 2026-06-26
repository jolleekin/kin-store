import type {
  MergeReducers,
  Methods,
  NestedMethods,
  NestedReducers,
  PluginContext,
  SkipFirst,
  StorePlugin,
  StoreWithPlugins,
} from "@kin-store/core/index.ts";

import { type Draft, produce } from "immer";

// deno-lint-ignore no-explicit-any
type ImmerReducer<TState, TArgs extends any[] = any[]> = (
  draft: Draft<TState>,
  ...args: TArgs
) => void;

type ImmerReducers<TState> = Record<string, ImmerReducer<TState>>;

type ToStandardReducer<TState, TImmerReducer extends ImmerReducer<TState>> = (
  state: TState,
  ...args: SkipFirst<TState, Parameters<TImmerReducer>>
) => TState;

type ToStandardReducers<
  TState,
  TImmerReducers extends ImmerReducers<TState>,
> = {
  [K in keyof TImmerReducers]: ToStandardReducer<TState, TImmerReducers[K]>;
};

type ImmerStore<
  TState,
  TStoreReducers extends NestedReducers<TState>,
  TStoreMethods extends NestedMethods,
> =
  & Omit<
    StoreWithPlugins<TState, TStoreReducers, TStoreMethods>,
    "set"
  >
  & {
    set: (recipe: (draft: Draft<TState>) => void) => void;
  };

type ImmerPlugin<
  TState,
  TStoreReducers extends NestedReducers<TState>,
  TStoreMethods extends NestedMethods,
  TNamespace extends string | undefined,
  TPluginReducers extends ImmerReducers<TState>,
  TPluginMethods extends Methods,
> =
  & Pick<
    StorePlugin<
      TState,
      TStoreReducers,
      TStoreMethods,
      TNamespace,
      ToStandardReducers<TState, TPluginReducers>
    >,
    "middleware"
  >
  & {
    /** @see {StorePlugin.onDestroy} */
    reducers?: { [K in keyof TPluginReducers]: TPluginReducers[K] };

    /** @see {StorePlugin.onDestroy} */
    methods?: (
      store: ImmerStore<
        TState,
        MergeReducers<
          TStoreReducers,
          TNamespace,
          ToStandardReducers<TState, TPluginReducers>
        >,
        TStoreMethods
      >,
      options: PluginContext<TNamespace>,
    ) => TPluginMethods;

    /** @see {StorePlugin.onDestroy} */
    onActivated?: (
      store: ImmerStore<
        TState,
        MergeReducers<
          TStoreReducers,
          TNamespace,
          ToStandardReducers<TState, TPluginReducers>
        >,
        TStoreMethods
      >,
      ctx: PluginContext<TNamespace>,
    ) => void;

    /** @see {StorePlugin.onDestroy} */
    onDestroy?: (
      store: ImmerStore<
        TState,
        MergeReducers<
          TStoreReducers,
          TNamespace,
          ToStandardReducers<TState, TPluginReducers>
        >,
        TStoreMethods
      >,
      ctx: PluginContext<TNamespace>,
    ) => void;
  };

function asImmerStore<
  TState,
  TStoreReducers extends NestedReducers<TState>,
  TStoreMethods extends NestedMethods,
>(
  store: StoreWithPlugins<TState, TStoreReducers, TStoreMethods>,
): ImmerStore<TState, TStoreReducers, TStoreMethods> {
  return {
    ...(store as Omit<typeof store, "set">),
    set: (recipe: (draft: Draft<TState>) => void) =>
      store.set(produce(store.get(), recipe)),
  };
}

/**
 * Adapter that lets you write reducers (and `set` calls) using
 * [Immer](https://immerjs.github.io/immer/) draft mutations instead of
 * returning new state objects.
 *
 * Pass an {@linkcode ImmerPlugin}-shaped object to `immer()` and the returned
 * value is a standard {@linkcode StorePlugin} whose reducers wrap each Immer
 * reducer with `produce`. The `methods`, `onActivated`, and `onDestroy`
 * callbacks receive an `ImmerStore` where `set` accepts a recipe function
 * `(draft) => void` instead of a full state replacement.
 *
 * @param plugin An Immer-flavoured plugin definition.
 * @returns A standard {@linkcode StorePlugin} ready to pass to `store.use()`.
 *
 * @example Basic counter with Immer reducers
 * ```ts
 * import { immer } from "@kin-store/plugins/index.ts";
 *
 * const store = withPlugins({ count: 0, items: [] as string[] }).use(
 *   immer({
 *     reducers: {
 *       increment(draft, amount: number): void {
 *         draft.count += amount;
 *       },
 *       addItem(draft, item: string): void {
 *         draft.items.push(item);
 *       },
 *     },
 *     methods: (store) => ({
 *       reset(): void {
 *         // store.set accepts a recipe too.
 *         store.set((draft) => {
 *           draft.count = 0;
 *           draft.items = [];
 *         });
 *       },
 *     }),
 *   }),
 * );
 *
 * store.dispatch.increment(3);
 * store.dispatch.addItem("hello");
 * store.reset();
 * ```
 *
 * @example Namespaced Immer plugin
 * ```ts
 * const store = withPlugins({ todos: [] as Todo[] }).use(
 *   "todos",
 *   immer({
 *     reducers: {
 *       add(draft, title: string): void {
 *         draft.todos.push({ id: Date.now(), title, done: false });
 *       },
 *       toggle(draft, id: number): void {
 *         const todo = draft.todos.find((t) => t.id === id);
 *         if (todo) todo.done = !todo.done;
 *       },
 *     },
 *   }),
 * );
 *
 * store.dispatch.todos.add("Buy milk");
 * store.dispatch.todos.toggle(someId);
 * ```
 */
/**
 * @template TState The store's state type.
 * @template TStoreReducers Reducers already on the store before this plugin is applied.
 * @template TStoreMethods Methods already on the store before this plugin is applied.
 * @template TNamespace The namespace passed to `store.use(namespace, immer(...))`,
 * or `undefined` for top-level. Inferred automatically.
 * @template TPluginReducers The Immer-flavoured reducers contributed by this plugin.
 * @template TPluginMethods The methods contributed by this plugin.
 */
export function immer<
  TState,
  TStoreReducers extends NestedReducers<TState>,
  TStoreMethods extends NestedMethods,
  TNamespace extends string | undefined,
  TPluginReducers extends ImmerReducers<TState>,
  TPluginMethods extends Methods,
>(
  plugin: ImmerPlugin<
    TState,
    TStoreReducers,
    TStoreMethods,
    TNamespace,
    TPluginReducers,
    TPluginMethods
  >,
): StorePlugin<
  TState,
  TStoreReducers,
  TStoreMethods,
  TNamespace,
  ToStandardReducers<TState, TPluginReducers>,
  TPluginMethods
> {
  type StandardPluginReducers = ToStandardReducers<TState, TPluginReducers>;

  // Destructure `plugin` so it can be garbage collected.
  const {
    reducers: pReducers,
    methods: pMethods,
    onActivated: pOnActivated,
    onDestroy: pOnDestroy,
    middleware,
  } = plugin;

  // Convert immer reducers to standard reducers.

  let reducers: StandardPluginReducers | undefined;

  if (pReducers) {
    reducers = {} as StandardPluginReducers;

    for (const name of Object.keys(pReducers)) {
      type TName = keyof TPluginReducers;

      const immerReducer = pReducers[name as TName];

      const standardReducer: StandardPluginReducers[TName] = (state, ...args) =>
        produce(state, (draft) => immerReducer(draft, ...args));

      reducers[name as TName] = standardReducer;
    }
  }

  // Wrap methods to provide immer store.

  type ReturnedPlugin = StorePlugin<
    TState,
    TStoreReducers,
    TStoreMethods,
    TNamespace,
    StandardPluginReducers,
    TPluginMethods
  >;

  let methods: ReturnedPlugin["methods"] | undefined;

  if (pMethods) {
    methods = (store, ctx) => pMethods(asImmerStore(store), ctx);
  }

  // Wrap onActivated to provide immer store.

  let onActivated: ReturnedPlugin["onActivated"] | undefined;

  if (pOnActivated) {
    onActivated = (store, ctx) => pOnActivated(asImmerStore(store), ctx);
  }

  // Wrap onDestroy to provide immer store.

  let onDestroy: ReturnedPlugin["onDestroy"] | undefined;

  if (pOnDestroy) {
    onDestroy = (store, ctx) => pOnDestroy(asImmerStore(store), ctx);
  }

  return {
    middleware: middleware,
    reducers,
    methods,
    onActivated,
    onDestroy,
  };
}
