import { assertEquals } from "@std/assert";
import { withPlugins } from "@kin-store/core/index.ts";
import { immer } from "./immer.ts";

Deno.test("immer - reducer mutates draft to produce new state", () => {
  const store = withPlugins({ count: 0 }).use(
    immer({
      reducers: {
        increment(draft, amount: number) {
          draft.count += amount;
        },
      },
    }),
  );

  store.dispatch.increment(3);
  assertEquals(store.get().count, 3);
});

Deno.test("immer - multiple reducers", () => {
  const store = withPlugins({ count: 0, items: [] as string[] }).use(
    immer({
      reducers: {
        increment(draft, n: number) {
          draft.count += n;
        },
        addItem(draft, item: string) {
          draft.items.push(item);
        },
      },
    }),
  );

  store.dispatch.increment(2);
  store.dispatch.addItem("hello");
  assertEquals(store.get(), { count: 2, items: ["hello"] });
});

Deno.test("immer - original state is not mutated", () => {
  const initial = { count: 0 };
  const store = withPlugins(initial).use(
    immer({
      reducers: {
        increment(draft) {
          draft.count++;
        },
      },
    }),
  );

  store.dispatch.increment();
  assertEquals(initial.count, 0); // untouched
});

Deno.test("immer - set in methods accepts a recipe", () => {
  const store = withPlugins({ count: 0, items: [] as string[] }).use(
    immer({
      reducers: {
        increment(draft, n: number) {
          draft.count += n;
        },
      },
      methods: (s) => ({
        reset() {
          s.set((draft) => {
            draft.count = 0;
            draft.items = [];
          });
        },
      }),
    }),
  );

  store.dispatch.increment(5);
  (store as unknown as { reset(): void }).reset();
  assertEquals(store.get(), { count: 0, items: [] });
});

Deno.test("immer - namespaced immer plugin", () => {
  const store = withPlugins({ todos: [] as { title: string; done: boolean }[] })
    .use(
      "todos",
      immer({
        reducers: {
          add(draft, title: string) {
            draft.todos.push({ title, done: false });
          },
          complete(draft, index: number) {
            draft.todos[index].done = true;
          },
        },
      }),
    );

  store.dispatch.todos.add("Buy milk");
  store.dispatch.todos.complete(0);
  assertEquals(store.get().todos[0], { title: "Buy milk", done: true });
});

Deno.test("immer - middlewares still run for immer reducers", () => {
  let called = 0;

  const store = withPlugins({ count: 0 }).use(
    immer({
      reducers: {
        increment(draft) {
          draft.count++;
        },
      },
      middleware: () => [(_ctx, next) => {
        called++;
        return next();
      }],
    }),
  );

  store.dispatch.increment();
  assertEquals(called, 1);
});

Deno.test("immer - onActivated receives immer-wrapped store", () => {
  let stateAtActivation: { count: number } | undefined;

  withPlugins({ count: 7 }).use(
    immer({
      reducers: {},
      onActivated: (store) => {
        stateAtActivation = store.get();
      },
    }),
  );

  assertEquals(stateAtActivation?.count, 7);
});

Deno.test("immer - array push via draft does not share refs across dispatches", () => {
  const store = withPlugins({ items: [] as number[] }).use(
    immer({
      reducers: {
        push(draft, n: number) {
          draft.items.push(n);
        },
      },
    }),
  );

  store.dispatch.push(1);
  const snap1 = store.get().items;
  store.dispatch.push(2);
  const snap2 = store.get().items;

  assertEquals(snap1, [1]);
  assertEquals(snap2, [1, 2]);
  assertEquals(snap1 === snap2, false); // different references
});
