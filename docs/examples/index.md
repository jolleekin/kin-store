# Guided Examples

Full, runnable apps in the [repository](https://github.com/jolleekin/kin-store/tree/main/examples),
walked through here for the parts that are specific to Kin Store.

| Guide                                                                       | What it covers                                                                              |
| ------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------- |
| [Next.js](/examples/nextjs)                                                 | SSR-safe store instantiation, `StoreProvider`, and `persist` with manual hydration.        |
| [TanStack Query and One Fat Store](/examples/tanstack-query-fat-store)     | Splitting client-owned state (Kin Store) from server-owned state (React Query), as a single `withPlugins` store. |
| [TanStack Query and Primitive Stores](/examples/tanstack-query-primitive-stores) | The same split, with each field as its own `createStore` merged by `derive`.        |
| [Cross-Tab Sync](/examples/cross-tab-sync)                                  | Recipes for syncing store state across open tabs, with `persist` and the `storage` event, or with `BroadcastChannel` alone. |
