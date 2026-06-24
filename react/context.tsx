import { createContext, type JSX, type ReactNode, useContext } from "react";

import type { Store } from "@kin-store/core/index.ts";

const StoreContext = createContext<Store | null>(null);

/**
 * React context provider that makes a store available to
 * {@linkcode useStoreContext} anywhere in the component tree below it.
 *
 * This is useful when you want to inject a store as a dependency (e.g. for
 * testing or server-side rendering) rather than importing a module-level
 * singleton.
 *
 * @example
 * ```tsx
 * const store = withPlugins({ count: 0 }).use(counterPlugin);
 *
 * function App(): JSX.Element {
 *   return (
 *     <StoreProvider store={store}>
 *       <Counter />
 *     </StoreProvider>
 *   );
 * }
 *
 * function Counter(): JSX.Element {
 *   const store = useStoreContext<typeof store>();
 *   const count = useSelector(store, (s) => s.count);
 *   return <button onClick={() => store.dispatch.increment(1)}>{count}</button>;
 * }
 * ```
 */
export function StoreProvider({
  store,
  children,
}: {
  store: Store;
  children: ReactNode;
}): JSX.Element {
  return (
    <StoreContext.Provider value={store}>{children}</StoreContext.Provider>
  );
}

/**
 * Returns the store injected by the nearest {@linkcode StoreProvider} ancestor.
 *
 * Intentionally named `useStoreContext` instead of `useStore` to clearly
 * indicate that this hook only triggers re-render when the store itself changes
 * rather than its state.
 *
 * To subscribe to the store's state changes, use {@linkcode useSelector} or
 * {@linkcode useSelectorWithEquality}.
 *
 * @throws If called outside a `<StoreProvider>` tree.
 *
 * @example
 * ```tsx
 * function MyComponent(): JSX.Element {
 *   // TStore narrows the store type returned by useStoreContext.
 *   const store = useStoreContext<typeof myStore>();
 *   const value = useSelector(store, (s) => s.someField);
 *   return <div>{value}</div>;
 * }
 * ```
 */
export function useStoreContext<TStore extends Store>(): TStore {
  const store = useContext(StoreContext);
  if (!store) {
    throw new Error(
      "useStoreContext can only be used in a <StoreProvider> context",
    );
  }
  return store as TStore;
}
