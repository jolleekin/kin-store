/**
 * `@kintools/store-plugins` — official plugins for `@kintools/store-core`'s
 * {@linkcode import("@kintools/store-core").withPlugins withPlugins}.
 *
 * - {@linkcode broadcast} syncs a store's state across browser tabs with
 *   `BroadcastChannel`.
 * - {@linkcode devtools} connects a store to the Redux DevTools Extension.
 * - {@linkcode history} adds undo/redo support.
 * - {@linkcode immer} lets reducers mutate a draft instead of returning a new
 *   state.
 * - {@linkcode persist} persists state to storage and rehydrates it on
 *   startup.
 *
 * @module
 */
export * from "./broadcast.ts";
export * from "./devtools.ts";
export * from "./history.ts";
export * from "./immer.ts";
export * from "./persist.ts";
