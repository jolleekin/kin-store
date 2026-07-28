# Changelog

## 0.2.3

- Document previously undocumented public symbols: `ReadonlyStore`,
  `Canceled`, `Methods`, `NestedMethods`. Export and document `Updater`
  (`createStore`) and `Getter`/`ComputeFn` (`derive`), which were referenced
  from public types without being exported themselves. Add a `@module` doc to
  `core/index.ts`.

## 0.2.2

- Add a `ReadonlyStore` base type (`get`/`subscribe`) that `Store` extends with
  `set`. `derive`, `useSelector`/`useSelectorWithEquality`, and
  `StoreProvider`/`useStoreContext` now accept `ReadonlyStore` instead of
  `Store`, so a `DerivedStore` can be passed anywhere a read-only store is
  expected, including as a source for another `derive()`, which previously
  didn't type-check.

## 0.2.1

- Fix `use()` type inference: without default type parameters, TypeScript fell
  back to the full `Reducers<TState>`/`Methods` constraint (instead of `{}`)
  when a plugin contributed no reducers/methods, so invalid
  `store.dispatch.<name>()`, `store.<name>()` calls went unflagged.

## 0.2.0

- Refactor `getState`/`setState` to `get`/`set`.

## 0.1.0

- Initial release.
