/**
 * `@kin-store/plugins` — official plugins for `@kin-store/core`'s
 * {@linkcode import("@kin-store/core/index.ts").withPlugins withPlugins}.
 *
 * - {@linkcode devtools} connects a store to the Redux DevTools Extension.
 * - {@linkcode history} adds undo/redo support.
 * - {@linkcode immer} lets reducers mutate a draft instead of returning a new
 *   state.
 * - {@linkcode persist} persists state to storage and rehydrates it on
 *   startup.
 *
 * @module
 */
export * from "./devtools.ts";
export * from "./history.ts";
export * from "./immer.ts";
export * from "./persist.ts";
