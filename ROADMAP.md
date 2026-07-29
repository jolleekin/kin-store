# Roadmap

This is a snapshot of where Kin Store is headed, not a committed schedule.
Priorities shift based on real usage and feedback; there are no target dates.
Have an opinion on ordering, or something missing? Open a
[Discussion](https://github.com/jolleekin/kin-store/discussions).

## In progress / near-term

- **CI on every PR**: run lint, tests, docs build, and a Next.js production
  build on every push, not just on release tags, with a status badge in the
  README.
- **Benchmarks**: reproducible, published benchmarks against Zustand, Redux
  Toolkit, Jotai, and TanStack Store, covering update fan-out, selector cost,
  derived-store recompute, memory, and plugin overhead. Bundle size is already
  proven; runtime performance isn't yet.

## Documentation

- Production guides: SSR/RSC, React Native, testing, error handling, plugin
  lifecycle, persistence, multi-store design, code splitting, framework
  compatibility.
- Fair migration guides from Zustand, Redux Toolkit, Jotai, and TanStack
  Store, including honest "when Kin Store is the wrong choice" guidance.
- Lead comparison pages with Kin Store's own wedge (flat, typed plugin
  composition) instead of centering competitor critique.

## Distribution and ecosystem

- First-class npm installation alongside JSR.
- First-party integrations: reset/audit/logger middleware, cross-tab
  persistence, testing utilities, and a real TanStack Query + Next.js guide.

## Discovery

- Focused landing pages (React state management, SSR state, persistence,
  TypeScript state management) and an llms.txt / FAQ / non-goals page once
  benchmarks and migration guides above are in place.

## Recently shipped

- SSR-safe `persist()`, awaited plugin lifecycle hooks with defined error
  behavior, hardened `useSelector`, an explicit `set` vs `dispatch` policy,
  and a `PluginStore` helper to simplify plugin-author-facing generics.
