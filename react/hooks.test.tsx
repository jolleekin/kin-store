/// <reference lib="dom" />
import { Window } from "happy-dom";
import { act, renderHook } from "@testing-library/react";
import { assertEquals, assertThrows } from "@std/assert";

import { createStore, withPlugins } from "@kin-store/core/index.ts";
import { useSelector, useSelectorWithEquality } from "./hooks.ts";
import { StoreProvider, useStoreContext } from "./context.tsx";

// ---------------------------------------------------------------------------
// DOM setup — required for React rendering
// ---------------------------------------------------------------------------

const window = new Window({ url: "http://localhost/" });
// deno-lint-ignore no-explicit-any
(globalThis as any).document = window.document;
// deno-lint-ignore no-explicit-any
(globalThis as any).window = window;
// deno-lint-ignore no-explicit-any
(globalThis as any).navigator = window.navigator;

// ---------------------------------------------------------------------------
// useSelector
// ---------------------------------------------------------------------------

Deno.test("useSelector - returns initial state", () => {
  const store = createStore({ count: 0 });
  const { result } = renderHook(() => useSelector(store));
  assertEquals(result.current, { count: 0 });
});

Deno.test("useSelector - re-renders when state changes", () => {
  const store = createStore({ count: 0 });
  const { result } = renderHook(() => useSelector(store));

  act(() => store.setState({ count: 5 }));
  assertEquals(result.current, { count: 5 });
});

Deno.test("useSelector - with selector returns slice", () => {
  const store = createStore({ count: 0, name: "Alice" });
  const { result } = renderHook(() => useSelector(store, (s) => s.name));
  assertEquals(result.current, "Alice");
});

Deno.test(
  "useSelector - does not re-render when unselected field changes",
  () => {
    const store = createStore({ count: 0, name: "Alice" });
    let renders = 0;

    const { result } = renderHook(() => {
      renders++;
      return useSelector(store, (s) => s.count);
    });

    const initialRenders = renders;
    act(() => store.setState({ count: 0, name: "Bob" })); // count unchanged
    assertEquals(result.current, 0);
    assertEquals(renders, initialRenders); // no extra render
  },
);

Deno.test("useSelector - re-renders when selected field changes", () => {
  const store = createStore({ count: 0, name: "Alice" });
  const { result } = renderHook(() => useSelector(store, (s) => s.count));

  act(() => store.setState({ count: 99, name: "Alice" }));
  assertEquals(result.current, 99);
});

// ---------------------------------------------------------------------------
// useSelectorWithEquality
// ---------------------------------------------------------------------------

Deno.test(
  "useSelectorWithEquality - suppresses re-render with custom equality",
  () => {
    const store = createStore({ items: [1, 2, 3] });
    let renders = 0;

    const { result } = renderHook(() => {
      renders++;
      return useSelectorWithEquality(
        store,
        (s) => s.items,
        (a, b) => JSON.stringify(a) === JSON.stringify(b),
      );
    });

    const initialRenders = renders;
    act(() => store.setState({ items: [1, 2, 3] })); // same content
    assertEquals(result.current, [1, 2, 3]);
    assertEquals(renders, initialRenders);
  },
);

Deno.test("useSelectorWithEquality - re-renders when content differs", () => {
  const store = createStore({ items: [1, 2, 3] });
  const { result } = renderHook(() =>
    useSelectorWithEquality(
      store,
      (s) => s.items,
      (a, b) => JSON.stringify(a) === JSON.stringify(b),
    ),
  );

  act(() => store.setState({ items: [1, 2] }));
  assertEquals(result.current, [1, 2]);
});

Deno.test(
  "useSelectorWithEquality - returns stable reference when equal",
  () => {
    const store = createStore({ items: [1, 2, 3] });

    const { result } = renderHook(() => {
      const r = useSelectorWithEquality(
        store,
        (s) => s.items,
        (a, b) => JSON.stringify(a) === JSON.stringify(b),
      );
      return r;
    });

    const ref1 = result.current;
    act(() => store.setState({ items: [1, 2, 3] }));
    const ref2 = result.current;

    assertEquals(ref1 === ref2, true); // same reference
  },
);

// ---------------------------------------------------------------------------
// StoreProvider / useStoreContext
// ---------------------------------------------------------------------------

Deno.test("useStoreContext - returns the provided store", () => {
  const store = withPlugins({ count: 0 });

  const { result } = renderHook(() => useStoreContext(), {
    wrapper: ({ children }) => (
      <StoreProvider store={store}>{children}</StoreProvider>
    ),
  });

  assertEquals(result.current, store);
});

Deno.test("useStoreContext - throws outside StoreProvider", () => {
  // renderHook wraps in React, so we expect the thrown error to propagate
  assertThrows(
    () => renderHook(() => useStoreContext()),
    Error,
    "StoreProvider",
  );
});
