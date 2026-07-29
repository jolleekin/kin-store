# Changelog

## 0.3.0

- **Breaking:** Split `useSelector` into two hooks. `useStore(store)` now only
  reads the whole state, with no selector overload and no per-render
  closure/ref overhead. `useSelector(store, selector, equalFn?)` is the sole
  way to select a slice, and always applies an equality check (defaulting to
  the new `shallowEqual` export) before deciding to re-render. This removes
  the previously unguarded raw-selector path, where a selector returning a new
  reference on every call (`.filter()`, `.map()`, an object literal) could
  throw "Maximum update depth exceeded" on mount.
- Add `shallowEqual`, the default equality function for `useSelector`, also
  usable standalone.
- Export a bare `.` package specifier (`@kin-store/react`) alongside
  `./index.ts`.
- Bump version to pick up `@kin-store/core` 0.3.0 (dependency only; note that
  `@kin-store/core`'s `MergeReducers` export, previously visible here too via
  `export * from "@kin-store/core"`, is gone).

## 0.2.3

- Split `useSelector`'s two overloads (whole-state vs. selector) into two
  fully documented JSDoc blocks, each with its own example, instead of the
  selector overload pointing back to the other. Add a `@module` doc to
  `react/index.ts`.

## 0.2.2

- Bump version to pick up `@kin-store/core` 0.2.2 dependency.

## 0.2.1

- Bump version to pick up `@kin-store/core` 0.2.1 dependency.
