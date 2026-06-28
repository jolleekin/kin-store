import {
  getPluginDispatch,
  type InferActions,
  type NestedMethods,
  type NestedReducers,
  type StorePlugin,
} from "@kin-store/core/index.ts";

type HistoryReducers<TState> = {
  /** @internal Replace the entire state (used by undo/redo/reset). */
  _restore: (state: TState, savedState: TState) => TState;
};

type HistoryMethods = {
  /** Returns `true` if there is a future state to redo. */
  canRedo(): boolean;

  /** Returns `true` if there is a past state to undo. */
  canUndo(): boolean;

  /**
   * Discards all history and makes the current state the new undo floor.
   * Useful after async hydration so that `undo` and `reset` do not step back
   * to the pre-hydration state.
   *
   * @example
   * ```ts
   * await store.persist.hydrationComplete();
   * store.history.rebase();
   * ```
   */
  rebase(): void;

  /**
   * Moves forward one step. Returns `true` if the move happened, `false` if
   * already at the latest state.
   */
  redo(): boolean;

  /**
   * Resets the store to the baseline state and clears the history.
   *
   * When a `limit` is set, the baseline is the earliest *remembered* state,
   * not necessarily the original initial state.
   */
  reset(): void;

  /**
   * Moves back one step. Returns `true` if the move happened, `false` if
   * already at the earliest state.
   */
  undo(): boolean;
};

export type HistoryOptions = {
  /**
   * Maximum number of snapshots to keep. When exceeded, the oldest snapshot is
   * dropped. Defaults to unlimited.
   */
  limit?: number;
};

/**
 * Plugin that tracks state history and enables undo / redo / reset.
 *
 * Every state change that goes through the dispatch pipeline is recorded.
 * Changes made via {@linkcode import("@kin-store/core/index.ts").StoreWithPlugins.set set}
 * (which bypasses the pipeline) are **also** recorded because the plugin
 * subscribes to all state changes via `store.subscribe`.
 *
 * The plugin adds an internal `_restore` reducer to the store. Undo, redo, and
 * reset all dispatch this reducer so the state change is visible to any
 * registered middlewares.
 *
 * The namespace is provided automatically via `store.use(namespace, history())` —
 * you do not need to pass it to the plugin factory itself.
 *
 * The plugin works by saving state snapshots rather than reducer actions so it
 * can support both reducer-based and `set`-based mutations.
 *
 * Pass `{ limit }` to cap memory use in apps with frequent state changes.
 * Once the limit is reached, the oldest snapshot is dropped on each new change.
 *
 * @remarks When used together with
 * {@linkcode import("./persist.ts").persist persist} plugin, place this plugin
 * after `persist`. If the `persist` plugin uses an async storage,
 * {@linkcode HistoryMethods.rebase rebase} is needed to set the hydrated state
 * as the new baseline.
 *
 * @example Basic usage
 * ```ts
 * const store = withPlugins({ count: 0 })
 *   .use({
 *     reducers: {
 *       increment: (state, n: number) => ({ ...state, count: state.count + n }),
 *     },
 *   })
 *   .use("history", history());
 *
 * store.dispatch.increment(1); // count = 1
 * store.dispatch.increment(1); // count = 2
 *
 * store.history.canUndo(); // true
 * store.history.undo();    // count = 1
 * store.history.redo();    // count = 2
 * store.history.reset();   // count = 0
 * ```
 */

/**
 * @template TState The store's state type.
 * @template TStoreReducers Reducers already on the store before this plugin is applied.
 * @template TStoreMethods Methods already on the store before this plugin is applied.
 * @template TNamespace The namespace passed to `store.use(namespace, history())`,
 * or `undefined` for top-level. Inferred automatically.
 */
export function history<
  TState,
  TStoreReducers extends NestedReducers<TState>,
  TStoreMethods extends NestedMethods,
  TNamespace extends string | undefined,
>(
  options: HistoryOptions = {},
): StorePlugin<
  TState,
  TStoreReducers,
  TStoreMethods,
  TNamespace,
  HistoryReducers<TState>,
  HistoryMethods
> {
  const { limit = Infinity } = options;
  const snapshots: TState[] = [];
  let index = 0;
  let isRestoring = false;

  function canUndo(): boolean {
    return index > 0;
  }

  function canRedo(): boolean {
    return index + 1 < snapshots.length;
  }

  return {
    reducers: {
      _restore: (_state, savedState: TState) => savedState,
    },

    methods: (store, { namespace }) => {
      const dispatch = getPluginDispatch(store, namespace) as InferActions<
        TState,
        HistoryReducers<TState>
      >;

      return {
        canRedo,
        canUndo,
        redo(): boolean {
          if (!canRedo()) return false;

          isRestoring = true;
          dispatch._restore(snapshots[++index]);
          isRestoring = false;
          return true;
        },
        reset() {
          isRestoring = true;
          dispatch._restore(snapshots[0]);
          snapshots.length = 1;
          index = 0;
          isRestoring = false;
        },
        rebase() {
          snapshots[0] = store.get();
          snapshots.length = 1;
          index = 0;
        },
        undo(): boolean {
          if (!canUndo()) return false;

          isRestoring = true;
          dispatch._restore(snapshots[--index]);
          isRestoring = false;
          return true;
        },
      };
    },

    onActivated: (store) => {
      snapshots.push(store.get());

      store.subscribe((get) => {
        if (isRestoring) return;

        snapshots.length = index + 1;
        snapshots.push(get());
        if (snapshots.length > limit) {
          snapshots.shift();
        }
        index = snapshots.length - 1;
      });
    },
  };
}
