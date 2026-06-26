import { assertEquals } from "@std/assert";
import { withPlugins } from "@kin-store/core/index.ts";
import { persist, type PersistStorage } from "./persist.ts";

function makeMemoryStorage(): PersistStorage & {
  data: Record<string, string>;
} {
  const data: Record<string, string> = {};
  return {
    data,
    getItem: (key) => data[key] ?? null,
    setItem: (key, value) => {
      data[key] = value;
    },
    removeItem: (key) => {
      delete data[key];
    },
  };
}

function makeStore(storage: PersistStorage, key = "test") {
  return withPlugins({ count: 0 })
    .use({
      reducers: { increment: (s, n: number) => ({ count: s.count + n }) },
    })
    .use("persist", persist({ key, storage }));
}

Deno.test("persist - hydrates state from storage on activation", async () => {
  const storage = makeMemoryStorage();
  storage.setItem("test", JSON.stringify({ value: { count: 42 }, version: 0 }));

  const store = makeStore(storage);
  await store.persist.hydrationComplete();
  assertEquals(store.get().count, 42);
});

Deno.test("persist - persists state changes to storage", async () => {
  const storage = makeMemoryStorage();
  const store = makeStore(storage);
  await store.persist.hydrationComplete();

  store.dispatch.increment(5);
  const raw = storage.getItem("test") as string;
  const stored = JSON.parse(raw);
  assertEquals(stored.value.count, 5);
});

Deno.test("persist - hasHydrated returns false before, true after", async () => {
  const storage = makeMemoryStorage();
  const store = makeStore(storage);
  // hasHydrated is false before the promise resolves
  await store.persist.hydrationComplete();
  assertEquals(store.persist.hasHydrated(), true);
});

Deno.test("persist - clear removes item from storage", async () => {
  const storage = makeMemoryStorage();
  const store = makeStore(storage);
  await store.persist.hydrationComplete();

  store.dispatch.increment(1);
  await store.persist.clear();
  assertEquals(storage.getItem("test"), null);
});

Deno.test("persist - skipHydration skips auto-hydration", async () => {
  const storage = makeMemoryStorage();
  storage.setItem(
    "skip-test",
    JSON.stringify({ value: { count: 99 }, version: 0 }),
  );

  const store = withPlugins({ count: 0 })
    .use(
      "persist",
      persist({ key: "skip-test", storage, skipHydration: true }),
    );

  // Not hydrated yet
  assertEquals(store.get().count, 0);
  assertEquals(store.persist.hasHydrated(), false);

  await store.persist.hydrate();
  assertEquals(store.get().count, 99);
  assertEquals(store.persist.hasHydrated(), true);
});

Deno.test("persist - selector persists only a slice", async () => {
  const storage = makeMemoryStorage();
  const store = withPlugins({ count: 0, label: "hello" })
    .use(
      "persist",
      persist({
        key: "slice-test",
        storage,
        selector: (s) => ({ count: s.count }),
        merge: (current, slice) => ({ ...current, ...slice }),
      }),
    );

  await store.persist.hydrationComplete();
  store.set({ count: 7, label: "world" });

  const raw = storage.getItem("slice-test") as string;
  const stored = JSON.parse(raw);
  assertEquals(stored.value, { count: 7 });
  // label is not persisted
  assertEquals(stored.value.label, undefined);
});

Deno.test("persist - version mismatch without migrate discards stored value", async () => {
  const storage = makeMemoryStorage();
  storage.setItem(
    "v-test",
    JSON.stringify({ value: { count: 50 }, version: 0 }),
  );

  const store = withPlugins({ count: 0 })
    .use("persist", persist({ key: "v-test", storage, version: 1 }));

  await store.persist.hydrationComplete();
  assertEquals(store.get().count, 0); // discarded
});

Deno.test("persist - migrate is called on version mismatch", async () => {
  const storage = makeMemoryStorage();
  storage.setItem(
    "m-test",
    JSON.stringify({ value: { count: 10 }, version: 0 }),
  );

  const store = withPlugins({ count: 0 })
    .use(
      "persist",
      persist({
        key: "m-test",
        storage,
        version: 1,
        migrate: (stored, _version) => ({
          count: (stored as { count: number }).count + 100,
        }),
      }),
    );

  await store.persist.hydrationComplete();
  assertEquals(store.get().count, 110);
});

Deno.test("persist - corrupted storage is silently ignored", async () => {
  const storage = makeMemoryStorage();
  storage.setItem("bad-test", "not-json{{{{");

  const store = withPlugins({ count: 0 })
    .use("persist", persist({ key: "bad-test", storage }));

  await store.persist.hydrationComplete();
  assertEquals(store.get().count, 0);
});

Deno.test("persist - onHydrationStart fires before hydration", async () => {
  const storage = makeMemoryStorage();
  storage.setItem(
    "onh-test",
    JSON.stringify({ value: { count: 5 }, version: 0 }),
  );

  let stateAtHydrate: { count: number } | undefined;
  // skipHydration so we can register the listener before hydration starts
  const store = withPlugins({ count: 0 })
    .use("persist", persist({ key: "onh-test", storage, skipHydration: true }));

  store.persist.onHydrationStart((state) => {
    stateAtHydrate = state;
  });

  await store.persist.hydrate();
  assertEquals(stateAtHydrate?.count, 0); // captured before restore
});

Deno.test("persist - onHydrationComplete fires after hydration", async () => {
  const storage = makeMemoryStorage();
  storage.setItem(
    "onh2-test",
    JSON.stringify({ value: { count: 7 }, version: 0 }),
  );

  let stateAfterHydrate: { count: number } | undefined;
  // skipHydration so we can register the listener before hydration starts
  const store = withPlugins({ count: 0 })
    .use(
      "persist",
      persist({ key: "onh2-test", storage, skipHydration: true }),
    );

  store.persist.onHydrationComplete((state) => {
    stateAfterHydrate = state;
  });

  await store.persist.hydrate();
  assertEquals(stateAfterHydrate?.count, 7);
});

Deno.test("persist - onHydrationStart unsubscribe works", async () => {
  const storage = makeMemoryStorage();
  let calls = 0;
  const store = withPlugins({ count: 0 })
    .use(
      "persist",
      persist({ key: "unsub-test", storage, skipHydration: true }),
    );

  const unsub = store.persist.onHydrationStart(() => calls++);
  unsub();

  await store.persist.hydrate();
  assertEquals(calls, 0);
});

Deno.test("persist - async storage is supported", async () => {
  const data: Record<string, string> = {};
  const asyncStorage: PersistStorage = {
    getItem: (key) => Promise.resolve(data[key] ?? null),
    setItem: (key, value) => {
      data[key] = value;
      return Promise.resolve();
    },
    removeItem: (key) => {
      delete data[key];
      return Promise.resolve();
    },
  };

  data["async-test"] = JSON.stringify({ value: { count: 33 }, version: 0 });

  const store = withPlugins({ count: 0 })
    .use("persist", persist({ key: "async-test", storage: asyncStorage }));

  await store.persist.hydrationComplete();
  assertEquals(store.get().count, 33);
});
