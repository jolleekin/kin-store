---
description: "Frequently asked questions and honest non-goals: what Kin Store deliberately doesn't do, framework support, SSR, DevTools, and where server state belongs."
---

# FAQ & Non-Goals

## Frequently asked questions

### Is Kin Store production-ready?

Yes for the core API (`createStore`, `withPlugins`, `derive`), the
official plugins, and the React bindings, all covered by tests that run
on every publish. The project is young, so treat the usual pre-1.0
signals (small community, short track record) as real inputs to your own
risk assessment, not something the docs will talk you out of.

### Does it work outside React?

Yes. `@kin-store/core` and `@kin-store/plugins` have zero framework
dependency: a store is a plain value with `get`/`set`/`subscribe`, usable
from any JS/TS environment (vanilla, a framework's own reactivity, a
worker, a Node/Deno backend). `@kin-store/react` is the only official
framework binding published today.

### Is there official Vue, Svelte, or Solid support?

Not yet. Nothing in the architecture is React-specific (`useStore` is a
thin `useSyncExternalStore` wrapper), so a similar binding for another
framework is plausible future work, but no such package exists or is
published today. `subscribe` is plain enough to wire into another
framework's reactivity by hand in the meantime.

### Does it work with SSR / Next.js?

Yes; see the [Next.js example](/examples/nextjs). SSR mainly changes two
things: where the store instance lives (constructed per-request or via a
provider, not a module-level singleton shared across requests) and when
`persist` is allowed to touch `localStorage` (skipped on the server,
hydrated explicitly on the client).

### Is there a DevTools integration?

Yes, via the official [`devtools`](/plugins/devtools) plugin, which
connects to the Redux DevTools Extension for time-travel debugging,
action replay, and jump-to-state. It is opt-in like every other plugin;
a store that never registers it carries no devtools code.

### Can reducers or methods be async?

`methods` can be async directly; a method is just a function with full
access to `get`/`set`/`dispatch`. `reducers` are pure and synchronous by
design, `(state, ...args) => nextState`, so async work (a `fetch` call)
belongs in a method that calls `dispatch` or `set` once the result is
ready, not in the reducer itself.

### How does Kin Store handle server state, caching, and refetching?

It doesn't, on purpose. `createStore`/`withPlugins` model state your
client owns; server-owned data (cached responses, request dedup,
background refetch) is TanStack Query's job, not Kin Store's. See the
[TanStack Query examples](/examples/) for two ways to split the two:
client state as one `withPlugins` store, or one `createStore` per field.

### Does `persist` or `broadcast` handle conflict resolution for concurrent edits?

No. `persist` writes state to storage and reads it back; `broadcast`
mirrors state across tabs with last-write-wins by wall-clock time,
so if two tabs change state within the same millisecond, one change is
silently dropped. Neither merges concurrent edits. For state that
genuinely needs that (real-time collaborative editing), reach for a CRDT
library instead.

### What's the bundle size?

`createStore` is 244 B gzipped, `withPlugins` is 1.07 KB, and `derive` is
465 B, each measured independently since you only pay for what you
`.use()`. Plugins and the React bindings add their own (small) cost on
top only when imported.

### Where do I ask a question or report a bug?

[GitHub Discussions](https://github.com/jolleekin/kin-store/discussions)
for questions and design feedback, [Issues](https://github.com/jolleekin/kin-store/issues)
for bugs.

## Non-goals

- **Not a server-state or data-fetching library.** No request cache, no
  dedup, no background refetch. Pair it with TanStack Query, SWR, or
  similar for that half of your state.
- **Not an implicit, proxy-based reactivity system.** State changes only
  through `set` or a dispatched reducer; nothing mutates a draft behind
  your back unless you explicitly opt into the [`immer`](/plugins/immer)
  plugin.
- **Not a schema-validation library.** State shape is whatever TypeScript
  type you give `createStore`; validating external input (an API
  response, a form) is left to a dedicated library.
- **Not multi-framework today.** `@kin-store/react` is the only official
  binding; there's no Vue, Svelte, or Solid package yet.
- **Not a CRDT or a general conflict-resolution system.** `persist` and
  `broadcast` are last-write-wins; concurrent, mergeable edits are out of
  scope.
- **Not trying to out-feature Redux.** No built-in serializable action
  log format, no time-travel outside the `devtools` plugin, no
  code-generation. The [comparison page](/comparison) covers the
  tradeoffs directly.
