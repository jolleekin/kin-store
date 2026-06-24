import {
  getPluginDispatch,
  type NestedMethods,
  type InferActions,
  type MergeReducers,
  type NestedReducers,
  type StorePlugin,
  type StoreWithPlugins,
} from "@kin-store/core/index.ts";

type PromiseOr<T> = Promise<T> | T;

/**
 * A storage backend compatible with the persist plugin.
 *
 * The interface intentionally mirrors the Web Storage API (`localStorage`,
 * `sessionStorage`) so those can be used directly. Any storage that
 * satisfies this contract — including async ones (e.g. IndexedDB wrappers) —
 * is accepted.
 *
 * @example Using a custom async storage
 * ```ts
 * const asyncStorage: PersistStorage = {
 *   async getItem(key: string): Promise<string | null> {
 *     return await myDB.get(key);
 *   },
 *   async setItem(key: string, value: string): Promise<void> {
 *     await myDB.set(key, value);
 *   },
 *   async removeItem(key: string): Promise<void> {
 *     await myDB.delete(key);
 *   },
 * };
 * ```
 */
export type PersistStorage = {
  getItem(key: string): PromiseOr<string | null>;
  removeItem(key: string): PromiseOr<void>;
  setItem(key: string, value: string): PromiseOr<void>;
};

/**
 * The value stored in the storage backend.
 *
 * Wraps the persisted state together with a schema version number so that
 * {@linkcode PersistOptions.migrate} can detect and handle breaking changes.
 *
 * @template TSlice The type of the persisted state slice (see
 * {@linkcode PersistOptions.selector}).
 */
export type StorageValue<TSlice> = {
  value: TSlice;
  version: number;
};

/**
 * Options for the {@linkcode persist} plugin.
 *
 * @template TState The store's full state type.
 * @template TSlice The slice of state that is actually persisted. Defaults to
 * the full state when no {@linkcode PersistOptions.selector selector} is
 * provided.
 */
export type PersistOptions<TState, TSlice = TState> = {
  /**
   * The key used to read and write the state in the storage backend.
   */
  key: string;

  /**
   * The storage backend. Defaults to {@linkcode localStorage}.
   */
  storage?: PersistStorage;

  /**
   * Selects the slice of state to persist. By default the entire state is
   * stored, but you can pass a selector to persist only a subset:
   *
   * ```ts
   * // Only persist the auth token, not transient UI state.
   * selector: (state) => ({ token: state.auth.token }),
   * ```
   */
  selector?: (state: TState) => TSlice;

  /**
   * Merges the hydrated slice back into the current state. Called after a
   * successful storage read, before dispatching the restored state.
   *
   * Defaults to a shallow merge (`{ ...current, ...slice }`), which works
   * correctly when {@linkcode PersistOptions.selector selector} returns a
   * partial object.
   *
   * @param current The store's live state at the moment of hydration.
   * @param slice The value read from storage (after migration, if any).
   */
  merge?: (current: TState, slice: TSlice) => TState;

  /**
   * Schema version for the stored state. Defaults to `0`.
   *
   * When the stored version differs from this value,
   * {@linkcode PersistOptions.migrate migrate} is called (if provided).
   * If `migrate` is not provided and the versions differ, the stored value is
   * discarded and the store keeps its default state.
   */
  version?: number;

  /**
   * Called when the stored version does not match
   * {@linkcode PersistOptions.version}. Receives the raw stored state and the
   * stored version number. Must return the migrated state (or a promise of it).
   *
   * @example
   * ```ts
   * migrate(stored: TSlice, version: number): TSlice {
   *   if (version === 0) return { ...stored, newField: "default" };
   *   return stored;
   * },
   * ```
   */
  migrate?: (stored: TSlice, version: number) => PromiseOr<TSlice>;

  /**
   * Encodes a {@linkcode StorageValue} to the string written to storage.
   * Defaults to {@linkcode JSON.stringify}.
   */
  encode?: (value: StorageValue<TSlice>) => string;

  /**
   * Decodes the string read from storage back into a {@linkcode StorageValue}.
   * Return `null` to signal that the stored value should be ignored.
   * Defaults to {@linkcode JSON.parse}.
   */
  decode?: (raw: string) => StorageValue<TSlice> | null;

  /**
   * When `true`, the plugin does **not** rehydrate from storage on activation.
   * Call `store.<namespace>.hydrate()` manually when ready (e.g. after
   * server-side rendering finishes).
   *
   * @default false
   */
  skipHydration?: boolean;
};

type PersistReducers<TState> = {
  /** @internal Restore a previously persisted state through the dispatch pipeline. */
  _restore: (state: TState, savedState: TState) => TState;
};

type PersistMethods<TState> = {
  /**
   * Returns a promise that resolves once the current or next hydration
   * completes. If no hydration is in progress and the store has already
   * hydrated, resolves immediately.
   *
   * Useful for coordinating with other plugins (e.g. `history`) that
   * need to re-baseline their state after the persisted value is loaded:
   *
   * ```ts
   * await store.persist.hydrationComplete();
   * store.history.rebase();
   * ```
   */
  hydrationComplete(): Promise<void>;

  /**
   * Returns `true` synchronously if at least one hydration has completed
   * successfully. Useful for conditional rendering without `await`.
   */
  hasHydrated(): boolean;

  /**
   * Triggers a fresh read from storage and applies the result to the store.
   * If a hydration is already in progress, returns its promise instead of
   * starting a new one — concurrent callers share the same read.
   *
   * Required when {@linkcode PersistOptions.skipHydration} is `true`.
   */
  hydrate(): Promise<void>;

  /**
   * Removes the persisted state from storage.
   *
   * This does **not** reset the in-memory store state. Call a reset action
   * separately if you also want to revert the live state.
   */
  clear(): PromiseOr<void>;

  /**
   * Registers a listener called at the **start** of each hydration, before
   * the storage read. Receives the store's current (pre-hydration) state.
   *
   * Returns an unsubscribe function.
   */
  onHydrationStart(cb: (state: TState) => void): () => void;

  /**
   * Registers a listener called when a hydration **completes** successfully.
   * Receives the store's state after hydration.
   *
   * Returns an unsubscribe function.
   */
  onHydrationComplete(cb: (state: TState) => void): () => void;
};

/**
 * Plugin that persists and hydrates the store state using a storage backend.
 *
 * On activation, the plugin reads any previously stored value, merges it with
 * the current state, and dispatches it through the pipeline via an internal
 * `_restore` reducer so middlewares can observe the hydration. It then
 * subscribes to the store and writes every state change to storage.
 *
 * @param options Persistence options.
 * The namespace is provided automatically via `store.use(namespace, persist(options))`.
 *
 * @example Persist entire state with localStorage (default)
 * ```ts
 * const store = withPlugins({ count: 0 })
 *   .use({
 *     reducers: {
 *       increment: (state, n: number) => ({ ...state, count: state.count + n }),
 *     },
 *   })
 *   .use("persist", persist({ key: "my-counter" }));
 *
 * store.dispatch.increment(1);
 * await store.persist.clear();
 * ```
 *
 * @example Persist a slice of state
 * ```ts
 * const store = withPlugins({ token: "", theme: "light", count: 0 })
 *   .use("persist", persist({
 *     key: "app",
 *     selector: (s) => ({ token: s.token }),
 *     merge: (slice, current) => ({ ...current, ...slice }),
 *   }));
 * ```
 *
 * @example Schema versioning with migration
 * ```ts
 * const store = withPlugins({ items: [] as Item[] })
 *   .use("persist", persist({
 *     key: "items",
 *     version: 1,
 *     migrate(stored, version) {
 *       if (version === 0) return { items: stored.todos ?? [] };
 *       return stored;
 *     },
 *   }));
 * ```
 *
 * @example SSR — skip auto-hydration and trigger manually
 * ```ts
 * const store = withPlugins({ user: null })
 *   .use("persist", persist({ key: "user", skipHydration: true }));
 *
 * // Later, on the client:
 * await store.persist.hydrate();
 * ```
 */
/**
 * @template TState The store's state type.
 * @template TStoreReducers Reducers already on the store before this plugin is applied.
 * @template TStoreMethods Methods already on the store before this plugin is applied.
 * @template TNamespace The namespace passed to `store.use(namespace, persist(...))`,
 * or `undefined` for top-level. Inferred automatically.
 * @template TSlice The slice of state that is persisted. Defaults to `TState`.
 */
export function persist<
  TState,
  TStoreReducers extends NestedReducers<TState>,
  TStoreMethods extends NestedMethods,
  TNamespace extends string | undefined,
  TSlice = TState,
>(
  options: PersistOptions<TState, TSlice>,
): StorePlugin<
  TState,
  TStoreReducers,
  TStoreMethods,
  TNamespace,
  PersistReducers<TState>,
  PersistMethods<TState>
> {
  const {
    key,
    storage = localStorage,
    selector = (s: TState) => s as unknown as TSlice,
    merge = (current: TState, slice: TSlice) => ({ ...current, ...slice }),
    version: targetVersion = 0,
    migrate,
    encode = JSON.stringify,
    decode = JSON.parse,
    skipHydration = false,
  } = options;

  type TStore = StoreWithPlugins<
    TState,
    MergeReducers<TStoreReducers, TNamespace, PersistReducers<TState>>
  >;

  let _hasHydrated = false;
  let _hydrating = false;
  let resolveActive!: () => void;
  let rejectActive!: (e: unknown) => void;
  // Always initialized so hydrated() has a real promise to return before any
  // hydration starts. _hydrate() resolves/rejects it; then it is set to null.
  let activeHydration: Promise<void> | undefined = new Promise<void>(
    (res, rej) => {
      resolveActive = res;
      rejectActive = rej;
    },
  );

  const onHydrationStartListeners = new Set<(state: TState) => void>();
  const onHydrationCompleteListeners = new Set<(state: TState) => void>();

  async function _hydrate(
    store: TStore,
    dispatch: InferActions<TState, PersistReducers<TState>>,
  ): Promise<void> {
    onHydrationStartListeners.forEach((cb) => cb(store.getState()));

    try {
      let raw = storage.getItem(key);
      if (raw instanceof Promise) raw = await raw;

      if (raw) {
        let storedValue: StorageValue<TSlice> | undefined;

        try {
          storedValue = decode(raw);
        } catch {
          // Corrupted storage value — skip restore.
        }

        let slice: TSlice | undefined;

        if (storedValue) {
          if (storedValue.version === targetVersion) {
            slice = storedValue.value;
          } else if (migrate) {
            slice = await migrate(storedValue.value, storedValue.version);
          }

          if (slice !== undefined) {
            dispatch._restore(merge(store.getState(), slice));
          }
        }
      }

      _hasHydrated = true;
      onHydrationCompleteListeners.forEach((cb) => cb(store.getState()));
      resolveActive();
    } catch (e) {
      rejectActive(e);
      throw e;
    }
  }

  function startHydration(
    store: TStore,
    dispatch: InferActions<TState, PersistReducers<TState>>,
  ): Promise<void> {
    if (!_hydrating) {
      if (!activeHydration) {
        // Re-hydration: create a fresh promise for this round.
        activeHydration = new Promise<void>((res, rej) => {
          resolveActive = res;
          rejectActive = rej;
        });
      }
      _hydrating = true;
      _hydrate(store, dispatch).finally(() => {
        _hydrating = false;
        activeHydration = undefined;
      });
    }
    return activeHydration!;
  }

  return {
    reducers: {
      _restore: (_state, savedState: TState) => savedState,
    },

    methods: (store, { namespace }) => {
      const dispatch = getPluginDispatch(store, namespace) as InferActions<
        TState,
        PersistReducers<TState>
      >;

      return {
        clear: () => storage.removeItem(key),
        hasHydrated: () => _hasHydrated,
        hydrate: () => startHydration(store, dispatch),
        hydrationComplete: () => activeHydration ?? Promise.resolve(),
        onHydrationStart: (cb: (state: TState) => void) => {
          onHydrationStartListeners.add(cb);
          return () => onHydrationStartListeners.delete(cb);
        },
        onHydrationComplete: (cb: (state: TState) => void) => {
          onHydrationCompleteListeners.add(cb);
          return () => onHydrationCompleteListeners.delete(cb);
        },
      };
    },

    async onActivated(store, { namespace }) {
      const dispatch = getPluginDispatch(store, namespace) as InferActions<
        TState,
        PersistReducers<TState>
      >;

      if (!skipHydration) {
        await startHydration(store, dispatch);
      }

      store.subscribe((getState) => {
        try {
          storage.setItem(
            key,
            encode({ value: selector(getState()), version: targetVersion }),
          );
        } catch {
          // Storage errors must not crash the app.
        }
      });
    },
  };
}
