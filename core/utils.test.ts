import { assertEquals } from "@std/assert";
import { createStore } from "./create-store.ts";
import { listenerWithSelector } from "./utils.ts";

Deno.test("listenerWithSelector - fires when selected slice changes", () => {
  const store = createStore({ count: 0, name: "Alice" });
  const calls: number[] = [];

  const listener = listenerWithSelector(
    (_getSlice, prevSlice) => calls.push(prevSlice),
    (s: { count: number; name: string }) => s.count,
  );

  store.subscribe(listener);
  store.set({ count: 1, name: "Alice" });
  store.set({ count: 2, name: "Alice" });
  assertEquals(calls.length, 2);
  assertEquals(calls, [0, 1]);
});

Deno.test(
  "listenerWithSelector - does not fire when unselected field changes",
  () => {
    const store = createStore({ count: 0, name: "Alice" });
    let calls = 0;

    const listener = listenerWithSelector(
      () => calls++,
      (s: { count: number; name: string }) => s.count,
    );

    store.subscribe(listener);
    store.set({ count: 0, name: "Bob" });
    assertEquals(calls, 0);
  },
);

Deno.test("listenerWithSelector - getSlice returns current slice", () => {
  const store = createStore({ count: 5 });
  let sliceFromCallback = 0;

  const listener = listenerWithSelector(
    (getSlice) => {
      sliceFromCallback = getSlice();
    },
    (s: { count: number }) => s.count,
  );

  store.subscribe(listener);
  store.set({ count: 10 });
  assertEquals(sliceFromCallback, 10);
});

Deno.test("listenerWithSelector - custom equality function", () => {
  const store = createStore({ items: [1, 2, 3] });
  let calls = 0;

  const listener = listenerWithSelector(
    () => calls++,
    (s: { items: number[] }) => s.items,
    { equal: (a, b) => JSON.stringify(a) === JSON.stringify(b) },
  );

  store.subscribe(listener);
  // Same content, different reference — should NOT fire
  store.set({ items: [1, 2, 3] });
  assertEquals(calls, 0);

  // Different content — should fire
  store.set({ items: [1, 2] });
  assertEquals(calls, 1);
});

Deno.test(
  "listenerWithSelector - initializes prevSlice from prevState on first call",
  () => {
    const store = createStore({ count: 42 });
    let prevReceived: number | undefined;

    const listener = listenerWithSelector(
      (_getSlice, prev) => {
        prevReceived = prev;
      },
      (s: { count: number }) => s.count,
    );

    store.subscribe(listener);
    store.set({ count: 99 });
    assertEquals(prevReceived, 42);
  },
);
