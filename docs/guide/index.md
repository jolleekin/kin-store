---
description: "Why Kin Store exists: three primitives (createStore, withPlugins, derive), zero dependencies, full type inference, and opt-in complexity you only pay for when you use it."
---

# Why Kin Store?

Kin Store starts from one constraint: the smallest set of ideas a state
library actually needs, and nothing past that.

## What we optimized for

- **Structure without ceremony** — plugins add a step, not a wrapper.
- **Zero boilerplate** — a store is a value and three methods, not a slice,
  a reducer, and a dispatch table.
- **100% type-safe by default** — inference does the work; you don't
  annotate what the compiler can already see.
- **No hidden cost** — you pay for what you `.use()`, nothing more.
- **Opt-in complexity that composes linearly** — each capability stacks on
  the last, it doesn't multiply against it.

## Three primitives

| Primitive                            | What it does                                                                          |
| ------------------------------------- | --------------------------------------------------------------------------------------- |
| [`createStore`](/guide/create-store) | The irreducible floor. `get` · `set` · `subscribe`. Nothing else.                     |
| [`withPlugins`](/guide/with-plugins) | Opt-in structure: methods, reducers, middleware, lifecycle hooks, namespaced plugins. |
| [`derive`](/guide/derive)            | Lazy, dependency-tracked, read-only views composed from one or more stores.           |

Curious how this holds up against Redux, Zustand, Jotai, or MobX in
practice? See the full [comparison](/comparison) — line-by-line, with the
tradeoffs named directly.

## Next

- [Getting Started](/guide/getting-started) — install and write your first store.
- [Design Principles](/guide/design-principles) — the reasoning behind each API choice.
