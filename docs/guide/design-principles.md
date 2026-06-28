# Design Principles

These four principles shaped every API decision in Kin Store. Understanding them
makes the library predictable — and explains why things work the way they do.

## Explicit over implicit

No hidden merges, no auto-propagating destroy, no magic dependency graphs. If
something happens, you triggered it.

`set` replaces the entire state — there is no shallow merge happening behind the
scenes. `derive` tracks only the stores you explicitly read with `get(store)`.
`destroy` must be called manually — nothing propagates to child stores
automatically. The `CANCELED` sentinel, named reducers, and the two-tier
mutation model all follow from this principle.

## Opt-in complexity

`createStore` is the floor. `withPlugins` adds methods, reducers, middleware,
and lifecycle hooks — only when you import it. `derive` adds reactive
composition — only when you reach for it. You never pay for capability you
haven't opted into.

## Type safety by default

Every reducer argument, dispatch call, and plugin method is fully inferred — no
`any` or `unknown`, no manual annotation at call sites. The type system is
load-bearing, not decorative.

`dispatch.addTodo("Buy groceries")` knows that `addTodo` takes a `string`. A
middleware that reads `ctx.reducer.args` gets the correct tuple type. A plugin
that adds methods sees the accumulated store type including every plugin
registered before it. Type errors are caught statically — at definition time or
at the call site.

## Two tiers of mutation

Reducers are pure functions that describe a named state transition. `dispatch.*`
routes them through the middleware pipeline — every call is traceable and
cancellable. This is the pipeline tier.

`set` bypasses the pipeline by design — use it when you need a hard reset that
must survive a guard middleware, or when traceability is not a goal.

Plugin methods sit above both: call `dispatch.*` to stay traceable, call `set`
for a direct state write, or mix both.
