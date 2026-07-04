/**
 * `@kin-store/core` — the framework-agnostic primitives every other Kin
 * Store package builds on.
 *
 * - {@linkcode createStore} creates a minimal reactive store: `get`, `set`,
 *   `subscribe`.
 * - {@linkcode withPlugins} upgrades a store (or creates one) with plugin
 *   support.
 * - {@linkcode derive} creates a read-only store computed from other stores,
 *   with automatic dependency tracking.
 *
 * @module
 */
export * from "./create-store.ts";
export * from "./derive.ts";
export * from "./with-plugins.ts";
export * from "./utils.ts";
