# Changelog

## @kin-store/core 0.2.1

- Fix `use()` type inference: without default type parameters, TypeScript
  fell back to the full `Reducers<TState>`/`Methods` constraint (instead of
  `{}`) when a plugin contributed no reducers/methods, so invalid
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
