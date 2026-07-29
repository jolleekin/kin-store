import { assertEquals } from "@std/assert";

import { shallowEqual } from "./shallow-equal.ts";

Deno.test("shallowEqual - same reference is equal", () => {
  const obj = { a: 1 };
  assertEquals(shallowEqual(obj, obj), true);
});

Deno.test("shallowEqual - equal primitives", () => {
  assertEquals(shallowEqual(1, 1), true);
  assertEquals(shallowEqual("a", "a"), true);
  assertEquals(shallowEqual(undefined, undefined), true);
  assertEquals(shallowEqual(1, 2), false);
});

Deno.test("shallowEqual - one side primitive, other object", () => {
  assertEquals(shallowEqual(null, {}), false);
  assertEquals(shallowEqual({}, null), false);
  assertEquals(shallowEqual(1, { a: 1 }), false);
});

Deno.test("shallowEqual - objects with same keys/values", () => {
  assertEquals(shallowEqual({ a: 1, b: 2 }, { a: 1, b: 2 }), true);
});

Deno.test("shallowEqual - objects with different values", () => {
  assertEquals(shallowEqual({ a: 1 }, { a: 2 }), false);
});

Deno.test("shallowEqual - objects with different key counts", () => {
  assertEquals(shallowEqual({ a: 1 }, { a: 1, b: 2 }), false);
});

Deno.test("shallowEqual - objects with different keys, same count", () => {
  assertEquals(shallowEqual({ a: 1 }, { b: 1 }), false);
});

Deno.test("shallowEqual - nested objects differ by reference", () => {
  assertEquals(shallowEqual({ a: { b: 1 } }, { a: { b: 1 } }), false);
});

Deno.test("shallowEqual - equal arrays", () => {
  assertEquals(shallowEqual([1, 2, 3], [1, 2, 3]), true);
});

Deno.test("shallowEqual - arrays with different lengths", () => {
  assertEquals(shallowEqual([1, 2, 3], [1, 2, 3, 4]), false);
});

Deno.test("shallowEqual - arrays with different order", () => {
  assertEquals(shallowEqual([1, 2, 3], [3, 2, 1]), false);
});
