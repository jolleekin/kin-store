import { assertEquals, assertThrows } from "@std/assert";

import { createStore } from "./create-store.ts";
import { CANCELED, withPlugins } from "./with-plugins.ts";

// ---------------------------------------------------------------------------
// Basic dispatch
// ---------------------------------------------------------------------------

Deno.test("withPlugins - reducer updates state via dispatch", () => {
  const store = withPlugins({ count: 0 }).use({
    reducers: {
      increment: (state, amount: number) => ({
        ...state,
        count: state.count + amount,
      }),
    },
  });

  store.dispatch.increment(3);
  assertEquals(store.getState().count, 3);
});

Deno.test("withPlugins - multiple reducers", () => {
  const store = withPlugins({ count: 0 }).use({
    reducers: {
      increment: (state, n: number) => ({ ...state, count: state.count + n }),
      reset: (state) => ({ ...state, count: 0 }),
    },
  });

  store.dispatch.increment(5);
  store.dispatch.reset();
  assertEquals(store.getState().count, 0);
});

Deno.test("withPlugins - duplicate top-level reducer name throws", () => {
  assertThrows(
    () =>
      withPlugins({ count: 0 })
        .use({ reducers: { inc: (s) => s } })
        .use({ reducers: { inc: (s) => s } }),
    Error,
    '"inc"',
  );
});

// ---------------------------------------------------------------------------
// Namespaced plugins
// ---------------------------------------------------------------------------

Deno.test("withPlugins - namespaced reducer dispatch", () => {
  const store = withPlugins({ items: [] as string[] }).use("list", {
    reducers: {
      add: (state, item: string) => ({
        ...state,
        items: [...state.items, item],
      }),
      clear: (state) => ({ ...state, items: [] }),
    },
  });

  store.dispatch.list.add("hello");
  store.dispatch.list.add("world");
  assertEquals(store.getState().items, ["hello", "world"]);
  store.dispatch.list.clear();
  assertEquals(store.getState().items, []);
});

Deno.test("withPlugins - duplicate namespace throws", () => {
  assertThrows(
    () =>
      withPlugins({})
        .use("ns", { reducers: { a: (s) => s } })
        .use("ns", { reducers: { b: (s) => s } }),
    Error,
    '"ns"',
  );
});

// ---------------------------------------------------------------------------
// Middleware
// ---------------------------------------------------------------------------

Deno.test("withPlugins - middleware runs in order", () => {
  const order: string[] = [];

  const store = withPlugins({ count: 0 }).use({
    reducers: { inc: (s) => ({ ...s, count: s.count + 1 }) },
    middleware: () => [
      (_ctx, next) => {
        order.push("A-before");
        const r = next();
        order.push("A-after");
        return r;
      },
      (_ctx, next) => {
        order.push("B-before");
        const r = next();
        order.push("B-after");
        return r;
      },
    ],
  });

  store.dispatch.inc();
  // Middleware nests like call frames: B's teardown runs before A's.
  assertEquals(order, ["A-before", "B-before", "B-after", "A-after"]);
});

Deno.test("withPlugins - middleware receives ctx with name and args", () => {
  let capturedName: string | undefined;
  let capturedArgs: unknown[] | undefined;

  const store = withPlugins({ count: 0 }).use({
    reducers: { increment: (s, n: number) => ({ ...s, count: s.count + n }) },
    middleware: () => [
      (ctx, next) => {
        capturedName = ctx.reducer.name as string;
        capturedArgs = ctx.reducer.args as unknown[];
        return next();
      },
    ],
  });

  store.dispatch.increment(7);
  assertEquals(capturedName, "increment");
  assertEquals(capturedArgs, [7]);
});

Deno.test("withPlugins - middleware can cancel dispatch", () => {
  const store = withPlugins({ count: 0 }).use({
    reducers: { inc: (s) => ({ ...s, count: s.count + 1 }) },
    middleware: () => [() => CANCELED],
  });

  store.dispatch.inc();
  assertEquals(store.getState().count, 0);
});

Deno.test("withPlugins - middleware can replace next state", () => {
  const store = withPlugins({ count: 0 }).use({
    reducers: { inc: (s) => ({ ...s, count: s.count + 1 }) },
    middleware: () => [() => ({ count: 99 })],
  });

  store.dispatch.inc();
  assertEquals(store.getState().count, 99);
});

Deno.test("withPlugins - calling next() twice throws", () => {
  const store = withPlugins({ count: 0 }).use({
    reducers: { inc: (s) => ({ ...s, count: s.count + 1 }) },
    middleware: () => [
      (_ctx, next) => {
        next();
        return next();
      },
    ],
  });

  assertThrows(() => store.dispatch.inc(), Error, "multiple times");
});

Deno.test("withPlugins - dispatch while dispatching throws", () => {
  const store = withPlugins({ count: 0 }).use({
    reducers: {
      inc: (s) => ({ ...s, count: s.count + 1 }),
      double: (s) => ({ ...s, count: s.count * 2 }),
    },
    middleware: () => [
      (_ctx, next) => {
        store.dispatch.double(); // reentrant
        return next();
      },
    ],
  });

  assertThrows(
    () => store.dispatch.inc(),
    Error,
    "while an action is being dispatched",
  );
});

// ---------------------------------------------------------------------------
// Methods
// ---------------------------------------------------------------------------

Deno.test("withPlugins - methods are added to the store", () => {
  const store = withPlugins({ count: 0 }).use({
    reducers: { set: (_, n: number) => ({ count: n }) },
    methods: (s) => ({
      doubled() {
        return s.getState().count * 2;
      },
    }),
  });

  store.dispatch.set(5);
  assertEquals(store.doubled(), 10);
});

Deno.test("withPlugins - namespaced methods", () => {
  const store = withPlugins({ count: 0 }).use("counter", {
    reducers: { set: (_, n: number) => ({ count: n }) },
    methods: (s) => ({
      doubled() {
        return s.getState().count * 2;
      },
    }),
  });

  store.dispatch.counter.set(4);
  assertEquals(store.counter.doubled(), 8);
});

Deno.test("withPlugins - duplicate method name throws", () => {
  assertThrows(
    () =>
      withPlugins({})
        .use({ methods: () => ({ foo: () => 1 }) })
        .use({ methods: () => ({ foo: () => 2 }) }),
    Error,
    '"foo"',
  );
});

// ---------------------------------------------------------------------------
// Lifecycle callbacks
// ---------------------------------------------------------------------------

Deno.test("withPlugins - onActivated is called after registration", () => {
  let activatedCount = 0;
  let stateAtActivation: { count: number } | undefined;

  withPlugins({ count: 42 }).use({
    onActivated: (store) => {
      activatedCount++;
      stateAtActivation = store.getState();
    },
  });

  assertEquals(activatedCount, 1);
  assertEquals(stateAtActivation?.count, 42);
});

Deno.test("withPlugins - onDestroy is called on destroy", () => {
  let destroyed = false;

  const store = withPlugins({}).use({
    onDestroy: () => {
      destroyed = true;
    },
  });

  store.destroy();
  assertEquals(destroyed, true);
});

// ---------------------------------------------------------------------------
// Destroy guard
// ---------------------------------------------------------------------------

Deno.test("withPlugins - destroy is idempotent", () => {
  const store = withPlugins({}).use({ onDestroy: () => {} });
  store.destroy();
  store.destroy(); // should not throw
});

Deno.test("withPlugins - getState throws after destroy", () => {
  const store = withPlugins({ x: 1 });
  store.destroy();
  assertThrows(() => store.getState(), Error, "destroyed");
});

Deno.test("withPlugins - setState throws after destroy", () => {
  const store = withPlugins({ x: 1 });
  store.destroy();
  assertThrows(() => store.setState({ x: 2 }), Error, "destroyed");
});

Deno.test("withPlugins - subscribe throws after destroy", () => {
  const store = withPlugins({ x: 1 });
  store.destroy();
  assertThrows(() => store.subscribe(() => {}), Error, "destroyed");
});

Deno.test("withPlugins - use throws after destroy", () => {
  const store = withPlugins({});
  store.destroy();
  assertThrows(
    () => store.use({ reducers: { a: (s) => s } }),
    Error,
    "destroyed",
  );
});

Deno.test("withPlugins - methods throw after destroy", () => {
  const store = withPlugins({ count: 0 }).use({
    methods: () => ({ getDouble: () => 2 }),
  });
  store.destroy();
  assertThrows(() => store.getDouble(), Error, "destroyed");
});

// ---------------------------------------------------------------------------
// Upgrading an existing store
// ---------------------------------------------------------------------------

Deno.test("withPlugins - upgrades an existing createStore", () => {
  const base = createStore({ count: 0 });
  const store = withPlugins(base).use({
    reducers: { reset: (s) => ({ ...s, count: 0 }) },
  });

  base.setState({ count: 5 });
  assertEquals(store.getState().count, 5);
  store.dispatch.reset();
  assertEquals(store.getState().count, 0);
});

// ---------------------------------------------------------------------------
// setState bypasses dispatch pipeline
// ---------------------------------------------------------------------------

Deno.test(
  "withPlugins - middleware from separate plugins appends in registration order",
  () => {
    const order: string[] = [];

    const store = withPlugins({ count: 0 })
      .use({
        reducers: { inc: (s) => ({ ...s, count: s.count + 1 }) },
        middleware: () => [
          (_ctx, next) => {
            order.push("plugin1");
            return next();
          },
        ],
      })
      .use({
        middleware: () => [
          (_ctx, next) => {
            order.push("plugin2");
            return next();
          },
        ],
      });

    store.dispatch.inc();
    assertEquals(order, ["plugin1", "plugin2"]);
  },
);

Deno.test(
  "withPlugins - middleware from earlier plugin can cancel action from later plugin's reducer",
  () => {
    const store = withPlugins({ count: 0 })
      .use({
        middleware: () => [() => CANCELED],
      })
      .use({
        reducers: { inc: (s) => ({ ...s, count: s.count + 1 }) },
      });

    store.dispatch.inc();
    assertEquals(store.getState().count, 0);
  },
);

Deno.test(
  "withPlugins - middleware can be a single function (not array)",
  () => {
    let called = false;

    const store = withPlugins({ count: 0 }).use({
      reducers: { inc: (s) => ({ ...s, count: s.count + 1 }) },
      middleware: () => (_ctx, next) => {
        called = true;
        return next();
      },
    });

    store.dispatch.inc();
    assertEquals(called, true);
    assertEquals(store.getState().count, 1);
  },
);

Deno.test("withPlugins - setState bypasses middleware", () => {
  let middlewareCalls = 0;
  const store = withPlugins({ count: 0 }).use({
    reducers: { inc: (s) => ({ ...s, count: s.count + 1 }) },
    middleware: () => [
      (_ctx, next) => {
        middlewareCalls++;
        return next();
      },
    ],
  });

  store.setState({ count: 99 });
  assertEquals(middlewareCalls, 0);
  assertEquals(store.getState().count, 99);
});

// ---------------------------------------------------------------------------
// Multiple plugins accumulate reducers and methods
// ---------------------------------------------------------------------------

Deno.test("withPlugins - multiple use() calls accumulate", () => {
  const store = withPlugins({ count: 0, label: "" })
    .use({ reducers: { inc: (s) => ({ ...s, count: s.count + 1 }) } })
    .use({ reducers: { setLabel: (s, l: string) => ({ ...s, label: l }) } });

  store.dispatch.inc();
  store.dispatch.setLabel("hi");
  assertEquals(store.getState(), { count: 1, label: "hi" });
});
