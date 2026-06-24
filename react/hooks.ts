import { useRef, useSyncExternalStore } from "react";

import type { Store } from "@kin-store/core/index.ts";

/**
 * Selects a slice of the state and triggers re-renders when it changes.
 *
 * Internally uses React's `useSyncExternalStore`, so it is safe to use in
 * concurrent mode.
 *
 * @template TState The store's state type.
 * @template TSlice The type of the selected slice. Defaults to `TState` when no
 * selector is provided.
 *
 * @param store The store to select from.
 * @param selector The selector function to extract the slice of state.
 * If not provided, the whole state is returned.
 *
 * @remarks
 * If {@linkcode selector} returns a new object every time, it will trigger
 * re-renders on every state change. Consider using
 * {@linkcode useSelectorWithEquality} instead.
 *
 * @example Selecting the whole state
 * ```tsx
 * function Counter(): JSX.Element {
 *   const state = useSelector(counterStore);
 *   return <div>{state.count}</div>;
 * }
 * ```
 *
 * @example Selecting a slice to avoid unnecessary re-renders
 * ```tsx
 * function UserName(): JSX.Element {
 *   // Only re-renders when `name` changes, not on every state update.
 *   const name = useSelector(userStore, (s) => s.name);
 *   return <span>{name}</span>;
 * }
 * ```
 */
export function useSelector<TState>(store: Store<TState>): TState;

export function useSelector<TState, TSlice = TState>(
  store: Store<TState>,
  selector: (state: TState) => TSlice,
): TSlice;

export function useSelector<TState, TSlice = TState>(
  store: Store<TState>,
  selector?: (state: TState) => TSlice,
): TState | TSlice {
  const getSnapshot = selector
    ? () => selector(store.getState())
    : store.getState;

  return useSyncExternalStore<TState | TSlice>(
    store.subscribe,
    getSnapshot,
    getSnapshot,
  );
}

/**
 * Selects a slice of the state and triggers re-renders when it changes.
 *
 * This hook accepts a custom equality function to determine if the slice has
 * changed. This can be useful to avoid unnecessary re-renders when the
 * selector returns a new object reference on every call (e.g. `.filter()`,
 * `.map()`, or object literals).
 *
 * @template TState The store's state type.
 * @template TSlice The type of the selected slice.
 *
 * @param store The store to select from.
 * @param selector The selector function to extract the slice of state.
 * @param equalFn The equality function to compare previous and next slices.
 * Return `true` if they are considered equal (i.e. no re-render is needed).
 * @returns The selected slice of state.
 *
 * @example Avoiding re-renders for derived arrays
 * ```tsx
 * import { shallowEqual } from "some-utils";
 *
 * function ActiveTodos(): JSX.Element {
 *   // selector returns a new array each time, but shallowEqual
 *   // prevents a re-render when the contents haven't changed.
 *   const active = useSelectorWithEquality(
 *     todoStore,
 *     (s) => s.items.filter((item) => !item.completed),
 *     shallowEqual,
 *   );
 *
 *   return <ul>{active.map((t) => <li key={t.id}>{t.title}</li>)}</ul>;
 * }
 * ```
 *
 * @example Using a simple deep-equality check
 * ```tsx
 * const settings = useSelectorWithEquality(
 *   appStore,
 *   (s) => ({ theme: s.theme, lang: s.lang }),
 *   (a, b) => a?.theme === b.theme && a?.lang === b.lang,
 * );
 * ```
 */
export function useSelectorWithEquality<TState, TSlice = TState>(
  store: Store<TState>,
  selector: (state: TState) => TSlice,
  equalFn: (prev: TSlice | undefined, next: TSlice) => boolean,
): TSlice {
  const prev = useRef<TSlice>(undefined);

  const newSelector = (state: TState): TSlice => {
    const next = selector(state);
    return equalFn(prev.current, next)
      ? (prev.current as TSlice)
      : (prev.current = next);
  };

  return useSelector(store, newSelector);
}
