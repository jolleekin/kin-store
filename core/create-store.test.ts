import { assertEquals } from "@std/assert";
import { createStore } from "./create-store.ts";

Deno.test("get returns initial state", () => {
  const store = createStore(42);
  assertEquals(store.get(), 42);
});

Deno.test("set with a value", () => {
  const store = createStore(0);
  store.set(5);
  assertEquals(store.get(), 5);
});

Deno.test("set with a callback", () => {
  const store = createStore(1);
  store.set((n) => n + 1);
  assertEquals(store.get(), 2);
});

Deno.test("subscribe - listener called on state change", () => {
  const store = createStore(0);
  let calls = 0;
  store.subscribe(() => calls++);
  store.set(1);
  assertEquals(calls, 1);
});

Deno.test("subscribe - listener receives get and prevState", () => {
  const store = createStore(10);
  let received: { prev: number; next: number } | undefined;
  store.subscribe((get, prevState) => {
    received = { prev: prevState, next: get() };
  });
  store.set(20);
  assertEquals(received, { prev: 10, next: 20 });
});

Deno.test("subscribe - no notification when value is unchanged", () => {
  const store = createStore(5);
  let calls = 0;
  store.subscribe(() => calls++);
  store.set(5);
  assertEquals(calls, 0);
});

Deno.test("subscribe - unsubscribe stops notifications", () => {
  const store = createStore(0);
  let calls = 0;
  const unsub = store.subscribe(() => calls++);
  unsub();
  store.set(1);
  assertEquals(calls, 0);
});

Deno.test("subscribe - multiple listeners all notified", () => {
  const store = createStore(0);
  let a = 0,
    b = 0;
  store.subscribe(() => a++);
  store.subscribe(() => b++);
  store.set(1);
  assertEquals(a, 1);
  assertEquals(b, 1);
});

Deno.test("subscribe - listener removed during notification doesn't affect others", () => {
  const store = createStore(0);
  let aCalls = 0;
  let bCalls = 0;

  // A self-unsubscribes the first time it fires
  let unsub: VoidFunction = () => {};
  unsub = store.subscribe(() => {
    aCalls++;
    unsub();
  });
  store.subscribe(() => bCalls++);

  store.set(1); // A fires once then removes itself; B still fires
  assertEquals(aCalls, 1);
  assertEquals(bCalls, 1);

  store.set(2); // A should NOT fire again
  assertEquals(aCalls, 1);
  assertEquals(bCalls, 2);
});

Deno.test("set - object state with same reference is skipped", () => {
  const state = { x: 1 };
  const store = createStore(state);
  let calls = 0;
  store.subscribe(() => calls++);
  store.set(state);
  assertEquals(calls, 0);
});
