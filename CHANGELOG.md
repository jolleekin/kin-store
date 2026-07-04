# Changelog

## @kin-store/core 0.2.2

- Add a `ReadonlyStore` base type (`get`/`subscribe`) that `Store` extends with
  `set`. `derive`, `useSelector`/`useSelectorWithEquality`, and
  `StoreProvider`/`useStoreContext` now accept `ReadonlyStore` instead of
  `Store`, so a `DerivedStore` can be passed anywhere a read-only store is
  expected — including as a source for another `derive()`, which previously
  didn't type-check.

## @kin-store/react 0.2.2

- Bump version to pick up `@kin-store/core` 0.2.2 dependency.

## @kin-store/plugins 0.3.4

- Bump version to pick up `@kin-store/core` 0.2.2 dependency.

## @kin-store/react 0.2.1

- Bump version to pick up `@kin-store/core` 0.2.1 dependency

## @kin-store/core 0.2.1

- Fix `use()` type inference: without default type parameters, TypeScript fell
  back to the full `Reducers<TState>`/`Methods` constraint (instead of `{}`)
  when a plugin contributed no reducers/methods, so invalid
  `store.dispatch.<name>()`, `store.<name>()` calls went unflagged.

## @kin-store/plugins 0.3.3

- Fix the same `use()` type inference issue in the `immer` plugin (see
  `@kin-store/core` 0.2.1).

## @kin-store/plugins 0.3.2

- Fix JSR deployment issue due to version and git tag mismatch.

## @kin-store/plugins 0.3.1

- Update README, add devtools and reorder sections.

## @kin-store/plugins 0.3.0

- Add devtools plugin.

## 0.2.0

- Refactor `getState`/`setState` to `get`/`set`.

## 0.1.0

- Initial release.
