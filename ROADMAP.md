# Roadmap

This is a snapshot of where Kin Store is headed, not a committed schedule.
Priorities shift based on real usage and feedback; there are no target dates.
Have an opinion on ordering, or something missing? Open a
[Discussion](https://github.com/kintools-dev/store/discussions).

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
- Fair migration guides from Zustand, Redux Toolkit, Jotai, and TanStack Store,
  including honest "when Kin Store is the wrong choice" guidance.

## Distribution and ecosystem

- First-class npm installation alongside JSR.
- First-party integrations: reset/audit/logger middleware, cross-tab
  persistence, testing utilities, and a real TanStack Query + Next.js guide.

## Discovery

- Focused landing pages (React state management, SSR state, persistence,
  TypeScript state management), once benchmarks and migration guides above are
  in place.

## Recently shipped

- SSR-safe `persist()`, awaited plugin lifecycle hooks with defined error
  behavior, hardened `useSelector`, an explicit `set` vs `dispatch` policy, and
  a `PluginStore` helper to simplify plugin-author-facing generics.
- A `broadcast` plugin for cross-tab state sync via `BroadcastChannel`.
- AI/agent discovery: `llms.txt`/`llms-full.txt` and a raw Markdown mirror of
  every docs page, `robots.txt` explicitly allowing major AI crawlers,
  `sitemap.xml`, distinct per-page descriptions, and an FAQ/non-goals page.
  Shipped ahead of the benchmarks/migration-guides gating above since none of it
  depends on unpublished performance claims.
- Comparison-page framing: the vs Redux/Zustand/MobX sections now lead with Kin
  Store's own model before naming the other library's cost, instead of opening
  with competitor critique.
