import {
  CANCELED,
  type NestedMethods,
  type NestedReducers,
  type StorePlugin,
} from "@kin-store/core/index.ts";

type DispatchMessage = {
  type: "DISPATCH";
  state: string;
  payload:
    | { type: "JUMP_TO_STATE" | "JUMP_TO_ACTION"; index: number }
    | { type: "RESET" | "COMMIT" | "ROLLBACK" }
    | {
      type: "IMPORT_STATE";
      nextLiftedState: {
        computedStates: { state: unknown }[];
        currentStateIndex: number;
      };
      preloadedState?: unknown;
    }
    | { type: "TOGGLE_ACTION" | "REORDER_ACTION"; id: number };
};

type DevtoolsMessage =
  | DispatchMessage
  | { type: "ACTION"; payload: string }
  | { type: "START" | "STOP" };

type Connection<TState> = {
  init(state: TState): void;
  send(action: { type: string; [key: string]: unknown }, state: TState): void;
  subscribe(listener: (message: DevtoolsMessage) => void): () => void;
  unsubscribe(): void;
  error(message: string): void;
};

type Extension = {
  connect<TState>(options?: {
    name?: string;
    features?: Record<string, boolean>;
  }): Connection<TState>;
};

export type DevtoolsOptions = {
  /**
   * The name shown in the Redux DevTools extension instance selector.
   * Defaults to `"kin-store"`.
   *
   * Names do not need to be unique — the extension tracks instances by
   * connection, not name — but duplicate names make the selector ambiguous
   * when multiple stores are registered. Use a distinct name per store.
   */
  name?: string;
};

/**
 * Plugin that connects a store to the
 * [Redux DevTools Extension](https://github.com/reduxjs/redux-devtools).
 *
 * This plugin is a thin bridge: every state change is forwarded to the
 * extension, and panel interactions are applied back to the store. The
 * extension owns the history timeline and diff UI; the plugin only needs to
 * keep them in sync.
 *
 * **Setup** — Install the browser extension, then register the plugin. No
 * namespace is required because the plugin adds no public methods or reducers:
 *
 * ```ts
 * const store = withPlugins(0)
 *   .use({
 *     reducers: {
 *       increment: (state, n: number) => state + n,
 *     },
 *   })
 *   .use(devtools({ name: "counter" }));
 * ```
 *
 * **Production** — The plugin is a no-op when the extension is absent, so it
 * is safe to leave in production code. To eliminate it from the bundle
 * entirely, use a ternary with your bundler's dev-mode flag. The bundler
 * replaces the flag with `false`, collapses the ternary to `{}`, and
 * tree-shakes the `devtools` import:
 *
 * ```ts
 * // Vite
 * .use(import.meta.env.DEV ? devtools() : {})
 *
 * // webpack / Next.js
 * .use(process.env.NODE_ENV !== "production" ? devtools() : {})
 * ```
 *
 * **State changes forwarded to the extension**
 *
 * | Source                         | Action type sent              |
 * | ------------------------------ | ----------------------------- |
 * | `store.dispatch.name(...args)` | `"name"` with `payload: args` |
 * | `store.set(...)`               | `"@@SET"`                     |
 *
 * **Supported panel actions**
 *
 * | Panel action           | Effect on the store                                 |
 * | ---------------------- | --------------------------------------------------- |
 * | Jump to state / action | Restores the selected state snapshot                |
 * | Reset                  | Restores the initial state (at plugin activation)   |
 * | Commit                 | Makes the current state the new rollback baseline   |
 * | Rollback               | Restores the last committed state                   |
 * | Import state           | Restores the active state from the imported session |
 *
 * Toggle action and reorder action are not supported because they require
 * replaying individual actions rather than restoring snapshots.
 *
 * @template TState The store's state type.
 * @template TStoreReducers Reducers already on the store before this plugin is registered.
 * @template TStoreMethods Methods already on the store before this plugin is registered.
 * @template TNamespace The namespace passed to `store.use(namespace, devtools())`,
 * or `undefined` for top-level. Inferred automatically.
 */
export function devtools<
  TState,
  TStoreReducers extends NestedReducers<TState>,
  TStoreMethods extends NestedMethods,
  TNamespace extends string | undefined,
>(
  options?: DevtoolsOptions,
): StorePlugin<TState, TStoreReducers, TStoreMethods, TNamespace> {
  const ext: Extension | undefined =
    // deno-lint-ignore no-explicit-any
    (globalThis as any).__REDUX_DEVTOOLS_EXTENSION__;

  if (!ext) return {};

  const connection = ext.connect<TState>({
    name: options?.name ?? "kin-store",
  });
  let pendingAction: { type: string; payload: unknown[] } | undefined;
  let isFromDevtools = false;

  return {
    // Records the action before store.set() fires subscribers.
    middleware: () => (ctx, next) => {
      const result = next();
      if (result !== CANCELED) {
        pendingAction = {
          type: String(ctx.reducer.name),
          payload: ctx.reducer.args as unknown[],
        };
      }
      return result;
    },

    onActivated: (store) => {
      const initialState = store.get();
      let committedState = initialState;

      connection.init(initialState);

      store.subscribe((get) => {
        if (isFromDevtools) return;

        connection.send(pendingAction ?? { type: "@@SET" }, get());
        pendingAction = undefined;
      });

      function restoreState(state: TState): void {
        isFromDevtools = true;
        store.set(state);
        isFromDevtools = false;
      }

      connection.subscribe((message) => {
        if (message.type !== "DISPATCH") return;

        switch (message.payload.type) {
          case "JUMP_TO_STATE":
          case "JUMP_TO_ACTION":
            restoreState(JSON.parse(message.state));
            break;
          case "RESET":
            restoreState(initialState);
            committedState = initialState;
            connection.init(initialState);
            break;
          case "COMMIT":
            committedState = store.get();
            connection.init(committedState);
            break;
          case "ROLLBACK":
            restoreState(committedState);
            connection.init(committedState);
            break;
          case "IMPORT_STATE": {
            const { computedStates, currentStateIndex } =
              message.payload.nextLiftedState;
            const target = computedStates[currentStateIndex]?.state;
            if (target !== undefined) restoreState(target as TState);
            break;
          }
        }
      });
    },

    onDestroy: () => {
      connection.unsubscribe?.();
    },
  };
}
