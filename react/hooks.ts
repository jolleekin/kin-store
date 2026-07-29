import { useRef, useSyncExternalStore } from "react";

import type { ReadonlyStore } from "@kin-store/core";
import { shallowEqual } from "./shallow-equal.ts";

/**
 * Reads the whole state and triggers re-renders on every state change.
 *
 * Internally uses React's `useSyncExternalStore`, so it is safe to use in
 * concurrent mode.
 *
 * To read only a slice of the state, use {@linkcode useSelector} instead.
 *
 * @template TState The store's state type.
 *
 * @param store The store to read from.
 *
 * @example Reading the whole state
 * ```tsx
 * const counter = createStore(0);
 *
 * function Counter(): JSX.Element {
 *   const count = useStore(counter);
 *   return <div>{count}</div>;
 * }
 * ```
 */
export function useStore<TState>(store: ReadonlyStore<TState>): TState {
  return useSyncExternalStore<TState>(store.subscribe, store.get, store.get);
}

/**
 * Selects a slice of the state and triggers re-renders when it changes.
 *
 * This hook accepts a custom equality function to determine if the slice has
 * changed. This can be useful to avoid unnecessary re-renders when the
 * selector returns a new object reference on every call (e.g. `.filter()`,
 * `.map()`, or object literals). Defaults to {@linkcode shallowEqual}, which
 * compares the slice one level deep.
 *
 * @template TState The store's state type.
 * @template TSlice The type of the selected slice.
 *
 * @param store The store to select from.
 * @param selector The selector function to extract the slice of state.
 * @param equalFn The equality function to compare the previous and next
 * slices. Return `true` if they are considered equal (i.e. no re-render is
 * needed). Only called once a previous slice exists, so `prev` is never
 * `undefined`; the first computed slice is used as-is. Defaults to
 * {@linkcode shallowEqual}.
 * @returns The selected slice of state.
 *
 * @example Selecting a slice to avoid unnecessary re-renders
 * ```tsx
 * function UserName(): JSX.Element {
 *   // Only re-renders when `name` changes, not on every state update.
 *   const name = useSelector(userStore, (s) => s.name);
 *   return <span>{name}</span>;
 * }
 * ```
 *
 * @example Avoiding re-renders for derived arrays with the default shallow equality
 * ```tsx
 * function ActiveTodos(): JSX.Element {
 *   // selector returns a new array each time; the default shallowEqual
 *   // prevents a re-render when the contents haven't changed.
 *   const active = useSelector(
 *     todoStore,
 *     (s) => s.items.filter((item) => !item.completed),
 *   );
 *
 *   return <ul>{active.map((t) => <li key={t.id}>{t.title}</li>)}</ul>;
 * }
 * ```
 *
 * @example Using a custom equality function for tolerance-based comparison
 * ```tsx
 * // shallowEqual requires an exact match per field; this instead ignores
 * // floating-point drift smaller than 0.001 in the computed ratio.
 * const progress = useSelector(
 *   downloadStore,
 *   (s) => s.bytesLoaded / s.totalBytes,
 *   (a, b) => Math.abs(a - b) < 0.001,
 * );
 * ```
 */
export function useSelector<TState, TSlice = TState>(
  store: ReadonlyStore<TState>,
  selector: (state: TState) => TSlice,
  equalFn: (prev: TSlice, next: TSlice) => boolean = shallowEqual,
): TSlice {
  const sliceRef = useRef<TSlice>(undefined);

  const getSnapshot = (): TSlice => {
    const prev = sliceRef.current;
    const next = selector(store.get());
    return prev !== undefined && equalFn(prev, next)
      ? prev
      : (sliceRef.current = next);
  };

  return useSyncExternalStore(
    store.subscribe,
    getSnapshot,
    getSnapshot,
  );
}
