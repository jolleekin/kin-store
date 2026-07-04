/**
 * `@kin-store/react` — React bindings for `@kin-store/core`, built on
 * `useSyncExternalStore`.
 *
 * - {@linkcode useSelector} and {@linkcode useSelectorWithEquality} subscribe
 *   a component to a store (or a slice of it).
 * - {@linkcode StoreProvider} and {@linkcode useStoreContext} inject a store
 *   via React context instead of a module-level singleton.
 *
 * Re-exports all of `@kin-store/core`, so consumers only need this one
 * package for React apps.
 *
 * @module
 */
export * from "@kin-store/core/index.ts";

export * from "./context.tsx";
export * from "./hooks.ts";
