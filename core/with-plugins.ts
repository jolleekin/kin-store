// deno-lint-ignore-file ban-types
import { IS_STORE, throwError } from "./_internals.ts";
import { createStore, type Store } from "./create-store.ts";

/**
 * Utility type that drops the first element of a tuple.
 *
 * Used to strip the leading `state` parameter from a reducer's parameter list
 * so only the user-supplied arguments remain.
 *
 * @template TFirst The type of the first element to remove.
 * @template TArgs The tuple from which the first element is dropped.
 *
 * @example
 * ```ts
 * type Args = SkipFirst<string, [string, number, boolean]>;
 * //   ^? [number, boolean]
 * ```
 */
export type SkipFirst<TFirst, TArgs> = TArgs extends [TFirst, ...infer Rest]
  ? Rest
  : TArgs;

/**
 * A pure function that takes the current state and additional arguments and
 * returns the next state.
 *
 * Reducers must be synchronous and free of side-effects.
 *
 * @example
 * ```ts
 * const increment: Reducer<number, [amount: number]> =
 *   (state, amount) => state + amount;
 * ```
 *
 * @template TState The state type this reducer operates on.
 * @template Args The additional arguments (beyond `state`) the reducer accepts.
 */
// deno-lint-ignore no-explicit-any
export type Reducer<TState, Args extends any[] = any[]> = (
  state: TState,
  ...args: Args
) => TState;

/**
 * Extracts the user-supplied arguments for a reducer (i.e. its parameter list
 * with the leading `state` parameter removed).
 *
 * @template TState The store's state type.
 * @template TReducer The reducer whose call signature is being unpacked.
 *
 * @example
 * ```ts
 * type MyReducer = Reducer<number, [amount: number]>;
 * type Args = ReducerArgs<number, MyReducer>;
 * //   ^? [amount: number]
 * ```
 */
export type ReducerArgs<TState, TReducer extends Reducer<TState>> = SkipFirst<
  TState,
  Parameters<TReducer>
>;

/**
 * A flattened map of reducer name → {@linkcode Reducer} for a given state type.
 */
export type Reducers<TState> = Record<string, Reducer<TState>>;

/**
 * Either a flattened {@linkcode Reducers} map **or** a one-level nested map where
 * each value is itself a `Reducers` map (a namespace).
 *
 * Top-level reducers are accessible at `store.dispatch.<name>`.
 * Namespaced reducers are accessible at `store.dispatch.<namespace>.<name>`.
 */
export type NestedReducers<TState> =
  | Reducers<TState>
  | Record<string, Reducers<TState>>;

/**
 * Context object passed to every middleware during a dispatch.
 *
 * @template TState The store's state type.
 * @template TReducers The store's flattened reducer map.
 * @template TReducerName The name of the reducer being dispatched.
 */
export type MiddlewareContext<
  TState,
  TReducers extends Reducers<TState>,
  TReducerName extends keyof TReducers,
> = {
  /** The current store state at the time of dispatch. */
  readonly state: TState;
  readonly reducer: {
    /** The name of the reducer being dispatched. */
    readonly name: TReducerName;
    /** The arguments passed to the action (excluding `state`). */
    readonly args: ReducerArgs<TState, TReducers[TReducerName]>;
  };
};

/**
 * Union of all possible {@linkcode MiddlewareContext} shapes for every reducer
 * in `TReducers`. Middleware receives this union, enabling discriminated-union
 * narrowing on `ctx.reducer.name`.
 *
 * @template TState The store's state type.
 * @template TReducers The flattened map of reducers registered on the store.
 *
 * @example
 * ```ts
 * const middleware: Middleware<State, Reducers> = (ctx, next) => {
 *   if (ctx.reducer.name === "increment") {
 *     // ctx.reducer.args is now inferred as [amount: number]
 *   }
 *   return next();
 * };
 * ```
 */
export type MiddlewareContextUnion<
  TState,
  TReducers extends Reducers<TState>,
> = {
  [K in keyof TReducers]: MiddlewareContext<TState, TReducers, K>;
}[keyof TReducers];

/**
 * Sentinel value returned by a middleware to cancel the dispatch.
 *
 * When a middleware returns `CANCELED` the reducer is **not** called and the
 * state is **not** updated.
 *
 * @example
 * ```ts
 * const guardMiddleware: Middleware<State, Reducers> = (ctx, next) => {
 *   if (!isAuthenticated()) return CANCELED;
 *   return next();
 * };
 * ```
 */
export const CANCELED = Symbol("canceled");
export type Canceled = typeof CANCELED;

/**
 * A middleware function that sits in the dispatch pipeline.
 *
 * Middleware functions are called in the order they were registered. Each must
 * either:
 * - Call `next()` to continue the pipeline and return its result.
 * - Return a new state to short-circuit the pipeline.
 * - Return {@linkcode CANCELED} to abort the dispatch entirely.
 *
 * Middleware is **synchronous**. For asynchronous logic use plugin methods or
 * top-level functions.
 *
 * @template TState The store's state type.
 * @template TReducers The flattened reducer map this middleware can observe.
 *
 * @example Logging middleware
 * ```ts
 * const logger: Middleware<State, Reducers> = (ctx, next) => {
 *   console.log("dispatching", ctx.reducer.name, ctx.reducer.args);
 *   const result = next();
 *   if (result !== CANCELED) console.log("next state", result);
 *   return result;
 * };
 * ```
 *
 * @example Cancellation middleware
 * ```ts
 * const readOnly: Middleware<State, Reducers> = (_ctx, _next) => CANCELED;
 * ```
 */
export type Middleware<TState, TReducers extends Reducers<TState>> = (
  ctx: MiddlewareContextUnion<TState, TReducers>,
  next: () => TState | Canceled,
) => TState | Canceled;

type InferActionsHelper<TState, TFn> =
  TFn extends Reducer<TState>
    ? (...args: ReducerArgs<TState, TFn>) => void
    : TFn extends Reducers<TState>
      ? InferActions<TState, TFn>
      : never;

/**
 * Maps a {@linkcode NestedReducers} map to a callable dispatch object.
 *
 * Each top-level entry becomes `dispatch.name(...args)`.
 * Each namespaced entry becomes `dispatch.namespace.name(...args)`.
 * The leading `state` parameter is stripped from every reducer's signature.
 *
 * @template TState The store's state type.
 * @template TNestedReducers The reducer map to derive dispatch signatures from.
 */
export type InferActions<
  TState,
  TNestedReducers extends NestedReducers<TState>,
> = {
  [K in keyof TNestedReducers]: InferActionsHelper<TState, TNestedReducers[K]>;
};

type InferDispatch<
  TState,
  TNestedReducers extends NestedReducers<TState>,
> = keyof TNestedReducers extends never
  ? {}
  : { dispatch: InferActions<TState, TNestedReducers> };

// deno-lint-ignore no-explicit-any
export type Methods = Record<string, (...args: any[]) => any>;
export type NestedMethods = Methods | Record<string, Methods>;

/**
 * A {@linkcode Store} extended with plugin support: reducer dispatch,
 * middleware, methods, and lifecycle hooks. Plugins registered via
 * {@linkcode StoreWithPlugins.use .use()} can contribute their own
 * reducers and methods.
 *
 * @template TState The store's state type.
 * @template TStoreReducers The accumulated reducers registered so far (via
 * {@linkcode StoreWithPlugins.use use}).
 * @template TStoreMethods The accumulated methods registered so far.
 */
export type StoreWithPlugins<
  TState = {},
  TStoreReducers extends NestedReducers<TState> = {},
  TStoreMethods extends NestedMethods = {},
> = Store<TState> & {
  /**
   * Destroys the store, removing all registered listeners and invoking
   * {@linkcode StorePlugin.onDestroy onDestroy} callbacks registered by
   * plugins.
   *
   * Calling `destroy()` more than once is safe and does nothing after the
   * first call. However, calling any other method (`getState`, `setState`,
   * `subscribe`, `use`, `dispatch.*`, methods defined by plugins) after
   * `destroy()` throws.
   */
  destroy(): void;

  /**
   * Registers a top-level plugin.
   *
   * A plugin can provide reducers, middleware, methods, and lifecycle hooks.
   *
   * ## Middleware
   *
   * Middleware intercepts the dispatch pipeline and can modify the returned
   * state or cancel the dispatch by returning {@linkcode CANCELED}.
   *
   * Middleware is synchronous. For asynchronous logic, use methods or
   * top-level functions.
   *
   * ## Reducers
   *
   * Reducers are pure functions that transform the current state.
   *
   * An action is automatically added to the store's `dispatch` property.
   * An error is thrown if an existing action with the same name already exists.
   *
   * This approach is much more ergonomic and performant compared to Redux.
   * Actions can be accessed and called directly without any hook required.
   *
   * ## Methods
   *
   * Methods are added to the store to extend its capability.
   *
   * Methods are powerful as they can have arbitrary logic with full access to
   * the store API. They can compute and return a derived value from the
   * current state, fetch data, dispatch actions, or call
   * {@linkcode StoreWithPlugins.setState setState} to bypass the dispatch
   * pipeline, and so on.
   *
   * @example Top-level plugin with reducers, middleware, and methods
   * ```ts
   * const store = withPlugins({ count: 0 }).use({
   *   reducers: {
   *     increment: (state, amount: number): { count: number } => ({
   *       ...state,
   *       count: state.count + amount,
   *     }),
   *   },
   *   middleware: () => [(ctx, next) => {
   *     console.log("dispatching", ctx.reducer.name);
   *     return next();
   *   }],
   *   methods: (store) => ({
   *     async fetchCount(): Promise<void> {
   *       const count = await api.getCount();
   *       store.dispatch.increment(count);
   *     },
   *   }),
   * });
   *
   * store.dispatch.increment(5); // logs: dispatching increment
   * await store.fetchCount();
   * ```
   */
  use<TPluginReducers extends Reducers<TState>, TPluginMethods extends Methods>(
    plugin: StorePlugin<
      TState,
      TStoreReducers,
      TStoreMethods,
      undefined,
      TPluginReducers,
      TPluginMethods
    >,
  ): StoreWithPlugins<
    TState,
    TStoreReducers & TPluginReducers,
    TStoreMethods & TPluginMethods
  >;

  /**
   * Registers a plugin under a namespace.
   *
   * The plugin's reducers are accessible at `store.dispatch.<namespace>.<name>`.
   * The plugin's methods are accessible at `store.<namespace>.<name>`.
   *
   * An error is thrown if the namespace is already taken by another plugin.
   *
   * @example Namespaced plugin
   * ```ts
   * const store = withPlugins({ items: [] as string[] })
   *   .use("list", {
   *     reducers: {
   *       add: (state, item: string): { items: string[] } => ({
   *         ...state,
   *         items: [...state.items, item],
   *       }),
   *       clear: (): { items: string[] } => ({ items: [] }),
   *     },
   *     methods: (store) => ({
   *       async fetchItems(): Promise<void> {
   *         const items = await api.getItems();
   *         store.dispatch.list.clear();
   *         items.forEach((item) => store.dispatch.list.add(item));
   *       },
   *     }),
   *   });
   *
   * store.dispatch.list.add("hello");
   * await store.list.fetchItems();
   * ```
   */
  use<
    TPluginNamespace extends string,
    TPluginReducers extends Reducers<TState>,
    TPluginMethods extends Methods,
  >(
    namespace: TPluginNamespace,
    plugin: StorePlugin<
      TState,
      TStoreReducers,
      TStoreMethods,
      TPluginNamespace,
      TPluginReducers,
      TPluginMethods
    >,
  ): StoreWithPlugins<
    TState,
    TStoreReducers & {
      [K in TPluginNamespace]: TPluginReducers;
    },
    TStoreMethods & {
      [K in TPluginNamespace]: TPluginMethods;
    }
  >;
} & InferDispatch<TState, TStoreReducers> &
  TStoreMethods;

type UnionToIntersection<U> =
  // deno-lint-ignore no-explicit-any
  (U extends any ? (k: U) => void : never) extends (k: infer I) => void
    ? I
    : never;

type Flatten<
  TState,
  TNestedReducers extends NestedReducers<TState>,
> = UnionToIntersection<
  {
    [K in keyof TNestedReducers]: TNestedReducers[K] extends Reducer<TState>
      ? { [P in K as `${P & string}`]: TNestedReducers[K] }
      : {
          [P in keyof TNestedReducers[K] as `${K & string}.${P & string}`]: TNestedReducers[K][P] extends Reducer<TState>
            ? TNestedReducers[K][P]
            : never;
        };
  }[keyof TNestedReducers]
>;

/**
 * Merges a plugin's reducers into the store's accumulated reducer map.
 *
 * When `TNamespace` is a `string`, the plugin's reducers are nested under that
 * key (`store.dispatch[TNamespace]`). When `undefined`, they are merged at the
 * top level.
 *
 * @template TStoreReducers The reducers already registered on the store.
 * @template TNamespace The plugin's namespace, or `undefined` for top-level.
 * @template TPluginReducers The reducers contributed by the plugin.
 */
export type MergeReducers<
  TStoreReducers,
  TNamespace extends string | undefined,
  TPluginReducers,
> = TNamespace extends string
  ? TStoreReducers & { [K in TNamespace]: TPluginReducers }
  : TStoreReducers & TPluginReducers;

type ArrayOr<T> = T[] | T;

/**
 * The shape of a plugin that can be registered with
 * {@linkcode StoreWithPlugins.use}.
 *
 * A plugin is a plain object with any combination of `reducers`,
 * `middlewares`, `methods`, `onActivated`, and `onDestroy`.
 *
 * @template TState The store's state type.
 * @template TStoreReducers Reducers already registered on the store before
 * this plugin is applied. Middleware can observe actions from these.
 * @template TStoreMethods Methods already registered on the store before this
 * plugin is applied.
 * @template TNamespace The namespace string passed to
 * `store.use(namespace, plugin)`, or `undefined` for top-level registration.
 * Inferred automatically — you rarely need to set this explicitly.
 * @template TPluginReducers Reducers contributed by this plugin.
 * @template TPluginMethods Methods contributed by this plugin.
 *
 * @example Full plugin
 * ```ts
 * type State = { count: number };
 *
 * const counterPlugin: StorePlugin<State> = {
 *   reducers: {
 *     increment: (state, amount: number): State => ({
 *       ...state,
 *       count: state.count + amount,
 *     }),
 *     reset: (): State => ({ count: 0 }),
 *   },
 *
 *   middleware: () => [(ctx, next) => {
 *     console.log("action:", ctx.reducer.name);
 *     return next();
 *   }],
 *
 *   methods: (store) => ({
 *     doubleCount(): number {
 *       return store.getState().count * 2;
 *     },
 *   }),
 *
 *   onActivated: (store) => {
 *     console.log("plugin activated, initial state:", store.getState());
 *   },
 *
 *   onDestroy: (store) => {
 *     console.log("store destroyed, final state:", store.getState());
 *   },
 * };
 *
 * const store = withPlugins({ count: 0 }).use(counterPlugin);
 * store.dispatch.increment(5);
 * console.log(store.doubleCount()); // 10
 * ```
 */
export type StorePlugin<
  TState,
  TStoreReducers extends NestedReducers<TState> = {},
  TStoreMethods extends NestedMethods = {},
  TNamespace extends string | undefined = undefined,
  TPluginReducers extends Reducers<TState> = {},
  TPluginMethods extends Methods = {},
> = {
  /**
   * Pure reducer functions that transform the store's state.
   *
   * Each entry `{ name: (state, ...args) => nextState }` is automatically
   * turned into a dispatchable action available at
   * `store.dispatch.name(...)` if {@linkcode TNamespace} is `undefined` or
   * `store.dispatch.TNamespace.name(...)` otherwise.
   *
   * Reducers are synchronous and must not produce side-effects. For
   * asynchronous logic, use {@linkcode StorePlugin.methods methods} instead.
   *
   * Registering a reducer whose name conflicts with an existing top-level
   * reducer throws an error.
   *
   * @example
   * ```ts
   * reducers: {
   *   setFilter(state, filter: string): typeof state {
   *     return { ...state, filter };
   *   },
   *   clearFilter(state): typeof state {
   *     return { ...state, filter: "" };
   *   },
   * }
   * ```
   */
  // Force TState to propagate into reducers.
  reducers?: { [K in keyof TPluginReducers]: TPluginReducers[K] };

  /**
   * Factory function that returns a middleware or an ordered list of
   * middleware that intercept every dispatched action on this store.
   *
   * Middleware functions run in the order they are defined. Each middleware
   * receives the dispatch context (`ctx`) and a `next` function. It must either
   * call `next()` to continue the pipeline, return a replacement state, or
   * return {@linkcode CANCELED} to abort the dispatch.
   *
   * Multiple plugins can each contribute middleware; they are appended in
   * registration order.
   *
   * @example Logging middleware
   * ```ts
   * middleware: ({ namespace }) => (ctx, next) => {
   *   console.log(`[${namespace}] →`, ctx.reducer.name, ctx.reducer.args);
   *   const result = next();
   *   if (result !== CANCELED) console.log(`[${namespace}] ←`, result);
   *   return result;
   * }
   * ```
   *
   * @example Guard middleware (cancel if unauthenticated)
   * ```ts
   * middleware: () => (ctx, next) => {
   *   if (!auth.isLoggedIn()) return CANCELED;
   *   return next();
   * }
   * ```
   */
  middleware?: (
    ctx: PluginContext<TNamespace>,
  ) => ArrayOr<
    Middleware<
      TState,
      Flatten<TState, TStoreReducers & TPluginReducers> extends Reducers<TState>
        ? Flatten<TState, TStoreReducers & TPluginReducers>
        : {}
    >
  >;

  /**
   * A factory function that returns an object of methods to add to the store.
   *
   * The factory receives the fully-assembled store (including reducers and
   * methods from all previously registered plugins and reducers from this
   * plugin itself) and a read-only
   * {@linkcode PluginContext options} object.
   *
   * Methods can contain arbitrary logic — including async operations — and have
   * full access to the store API: `getState`, `setState`, `subscribe`, and all
   * `dispatch.*` actions.
   *
   * Methods contributed by this plugin are **not** available to `methods`
   * itself (they are added to the store after the factory runs). To call a
   * method from within another method, use a plain function reference instead.
   *
   * @example Async data-fetching method
   * ```ts
   * methods: (store) => ({
   *   async loadUser(id: string): Promise<void> {
   *     const user = await api.fetchUser(id);
   *     store.dispatch.setUser(user);
   *   },
   * })
   * ```
   */
  methods?: (
    store: StoreWithPlugins<
      TState,
      MergeReducers<TStoreReducers, TNamespace, TPluginReducers>,
      TStoreMethods
    >,
    ctx: PluginContext<TNamespace>,
  ) => TPluginMethods;

  /**
   * Called once immediately after the plugin has been fully registered (after
   * its reducers, middlewares, and methods have been applied to the store).
   *
   * Use `onActivated` to subscribe to state changes, perform initialization
   * work, or read and modify the initial state.
   *
   * @example Subscribing to state changes on activation
   * ```ts
   * onActivated: (store) => {
   *   store.subscribe((getState) => {
   *     console.log("state changed:", getState());
   *   });
   * }
   * ```
   */
  onActivated?: (
    store: StoreWithPlugins<
      TState,
      MergeReducers<TStoreReducers, TNamespace, TPluginReducers>,
      TStoreMethods & TPluginMethods
    >,
    ctx: PluginContext<TNamespace>,
  ) => void;

  /**
   * Called when the store is destroyed (via {@linkcode StoreWithPlugins.destroy}).
   *
   * Use `onDestroy` to clean up any resources (timers, subscriptions, etc.)
   * that the plugin has set up.
   *
   * @example Clearing a timer on destroy
   * ```ts
   * let id: ReturnType<typeof setInterval> | undefined;
   *
   * onActivated: (store) => {
   *   id = setInterval(() => store.dispatch.tick(), 1000);
   * },
   * onDestroy: () => {
   *   clearInterval(id);
   * }
   * ```
   */
  onDestroy?: (
    store: StoreWithPlugins<
      TState,
      MergeReducers<TStoreReducers, TNamespace, TPluginReducers>,
      TStoreMethods & TPluginMethods
    >,
    ctx: PluginContext<TNamespace>,
  ) => void;
};

/**
 * Context object passed to a plugin's
 * {@linkcode StorePlugin.middleware middleware},
 * {@linkcode StorePlugin.methods methods},
 * {@linkcode StorePlugin.onActivated onActivated}, and
 * {@linkcode StorePlugin.onDestroy onDestroy}.
 *
 * Exposes the `namespace` the plugin was registered under (if any), which lets
 * the plugin locate its own actions on the dispatch object and its own methods.
 *
 * To access state at registration time, call `store.getState()` inside
 * {@linkcode StorePlugin.onActivated onActivated}.
 *
 * @template TNamespace The namespace under which the plugin was registered, or
 * `undefined` for top-level registration.
 */
export type PluginContext<
  TNamespace extends string | undefined = string | undefined,
> = {
  /**
   * The namespace string passed to `store.use(namespace, plugin)`, or
   * `undefined` when the plugin was registered at the top level.
   *
   * Use this to locate the plugin's own actions on the dispatch object:
   * ```ts
   * methods: (store, { namespace }) => {
   *   const dispatch = getPluginDispatch(store, namespace);
   *   return {
   *     restore(state) { dispatch._restore(state); },
   *   };
   * }
   * ```
   */
  namespace: TNamespace;
};

function runMiddlewares<
  TState,
  TReducers extends Reducers<TState>,
  TReducerName extends keyof TReducers,
>(
  middlewares: Middleware<TState, TReducers>[],
  ctx: MiddlewareContext<TState, TReducers, TReducerName>,
  next: () => TState | Canceled,
): TState | Canceled {
  let index = -1;

  function dfs(i: number): TState | Canceled {
    if (i <= index) throwError("next() was called multiple times");

    index = i;

    const middleware = middlewares[i];

    return middleware ? middleware(ctx, () => dfs(i + 1)) : next();
  }

  return dfs(0);
}

function isStore<TState>(x: unknown): x is Store<TState> {
  return x != null && typeof x === "object" && IS_STORE in x;
}

const { keys, hasOwn } = Object;

/**
 * Upgrades or creates a store with plugin support.
 *
 * Plugins only observe state changes that happen after they are registered.
 * Plugins registered later can access actions and methods defined by earlier plugins.
 *
 * @template TState The type of the state held by the store.
 *
 * @param input The store to upgrade or the initial state for a new store.
 * @returns A store with plugin support.
 *
 * @example Creating a store from scratch
 * ```ts
 * type State = { count: number };
 *
 * const store = withPlugins<State>({ count: 0 }).use({
 *   reducers: {
 *     increment: (state, amount: number): State => ({
 *       ...state,
 *       count: state.count + amount,
 *     }),
 *   },
 * });
 *
 * store.dispatch.increment(1);
 * console.log(store.getState().count); // 1
 * ```
 *
 * @example Upgrading an existing store
 * ```ts
 * type State = { count: number };
 *
 * const base = createStore<State>({ count: 0 });
 * const store = withPlugins(base).use({
 *   reducers: {
 *     reset: (): State => ({ count: 0 }),
 *   },
 * });
 * ```
 *
 * @example Namespaced plugins
 * ```ts
 * const store = withPlugins({ items: [] as string[] })
 *   .use("history", history())
 *   .use("persist", persist({ key: "my-store" }));
 *
 * store.persist.clear();
 * store.history.canUndo();
 * ```
 */
export function withPlugins<TState>(
  input: Store<TState> | TState,
): StoreWithPlugins<TState> {
  let isDestroyed = false;
  let isDispatching = false;

  const store = (
    isStore<TState>(input) ? input : createStore(input)
  ) as StoreWithPlugins<TState> & {
    dispatch?: Record<string, unknown>;
    [x: string]: unknown; // For methods.
  };

  const onDestroyCallbacks: ((theStore: typeof store) => void)[] = [];

  function checkDestroyed(): void | never {
    if (isDestroyed) throwError("The store has been destroyed");
  }

  const originalDestroy = store.destroy;
  store.destroy = () => {
    // destroy() is idempotent.
    if (isDestroyed) return;

    for (const callback of onDestroyCallbacks) {
      callback(store);
    }
    originalDestroy?.();

    isDestroyed = true;
  };

  const originalGetState = store.getState;
  store.getState = () => {
    checkDestroyed();
    return originalGetState();
  };

  const originalSetState = store.setState;
  store.setState = (next) => {
    checkDestroyed();
    originalSetState(next);
  };

  const originalSubscribe = store.subscribe;
  store.subscribe = (listener) => {
    checkDestroyed();
    return originalSubscribe(listener);
  };

  const middlewares: Middleware<TState, {}>[] = [];

  function dispatch<
    TReducers extends Reducers<TState>,
    TReducerName extends keyof TReducers,
  >(
    name: TReducerName,
    reducer: Reducer<TState>,
    args: ReducerArgs<TState, TReducers[TReducerName]>,
  ): void {
    checkDestroyed();

    if (isDispatching) {
      throwError(
        "Cannot dispatch another action while an action is being dispatched.",
      );
    }

    isDispatching = true;

    try {
      const state = store.getState();

      const next = () => reducer(state, ...args);

      let nextState: TState | Canceled;

      if (middlewares.length > 0) {
        nextState = runMiddlewares<TState, TReducers, TReducerName>(
          middlewares as unknown as Middleware<TState, TReducers>[],
          {
            reducer: { name, args },
            state,
          },
          next,
        );
      } else {
        nextState = next();
      }

      if (nextState !== CANCELED) store.setState(nextState);
    } finally {
      isDispatching = false;
    }
  }

  function addActions<TReducers extends Reducers<TState>>(
    target: Record<string, unknown>,
    namespace: string | undefined,
    reducers: TReducers,
  ): void {
    type Args = ReducerArgs<TState, TReducers[keyof TReducers]>;

    if (namespace) {
      // `target` is `store.dispatch[namespace]` - an empty object.
      for (const name of keys(reducers)) {
        const reducer = reducers[name];
        target[name] = (...args: Args) =>
          dispatch(`${namespace}.${name}`, reducer, args);
      }
    } else {
      // `target` is the `store.dispatch`.
      for (const name of keys(reducers)) {
        if (hasOwn(target, name)) {
          throwError(
            `A top-level reducer named "${name}" has already been registered`,
          );
        }
        const reducer = reducers[name];
        target[name] = (...args: Args) => dispatch(name, reducer, args);
      }
    }
  }

  function addMethods(target: Record<string, unknown>, methods: Methods): void {
    for (const name of keys(methods)) {
      if (hasOwn(target, name)) {
        throwError(
          `Failed to add method "${name}". A member with the same name already exists.`,
        );
      }

      const method = methods[name];

      target[name] = (...args: unknown[]) => {
        checkDestroyed();
        return method(...args);
      };
    }
  }

  function use(
    // deno-lint-ignore no-explicit-any
    namespace: string | StorePlugin<TState, any, any, any>,
    // deno-lint-ignore no-explicit-any
    plugin?: StorePlugin<TState, any, any, any>,
  ) {
    checkDestroyed();

    const p = typeof namespace === "string" ? plugin! : namespace;
    const ns = typeof namespace === "string" ? namespace : undefined;
    const ctx: PluginContext = { namespace: ns };

    const { middleware, reducers, methods, onActivated, onDestroy } = p;

    if (
      ns &&
      (hasOwn(store, ns) || (store.dispatch && hasOwn(store.dispatch, ns)))
    ) {
      throwError(
        `Another plugin has already been registered under the namespace "${ns}"`,
      );
    }

    if (reducers) {
      store.dispatch ??= {};
      const target = ns ? (store.dispatch[ns] = {}) : store.dispatch;
      addActions(target, ns, reducers);
    }

    if (middleware) {
      let values = middleware(ctx);
      if (!Array.isArray(values)) values = [values];
      middlewares.push(...values);
    }

    if (methods) {
      const target = ns
        ? ((store[ns] ??= {}) as Record<string, unknown>)
        : store;
      addMethods(target, methods(store, ctx));
    }

    onActivated?.(store, ctx);

    if (onDestroy) {
      onDestroyCallbacks.push((s) => onDestroy(s, ctx));
    }

    return store;
  }

  store.use = use;

  return store;
}
