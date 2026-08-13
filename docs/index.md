---
layout: home
# Opts out of VPHomeContent's `.vp-doc` prose wrapper (link underlines,
# paragraph spacing, table display, etc.) — this page's markdown supplies
# all its own styling via style.css.
markdownStyles: false
---

<div class="home">

<section class="hero">
  <h1>Kin Store</h1>
  <p class="tagline">A reactive state library for TypeScript.<br/>Framework-agnostic, zero dependencies, 100% type-safe.</p>
  <div class="actions">
    <a class="btn-primary" href="/guide/getting-started">Get Started</a>
    <a class="btn-secondary" href="https://github.com/jolleekin/kin-store">View on GitHub</a>
  </div>
</section>

<section class="why">
  <p class="eyebrow">Why it exists</p>
  <p>I wanted the smallest set of ideas a state library actually needs, and nothing past that. Three primitives came out of it: small enough to hold in your head, honest enough that nothing happens unless you triggered it.</p>
</section>

<section class="system">
  <p class="eyebrow">What it does differently</p>
  <div class="system-card">
    <div class="primitive-grid">
      <div class="primitive">
        <span class="step">01</span>
        <code>createStore</code>
        <span class="size">231 B</span>
        <p>Get, set, subscribe. Nothing else.</p>
      </div>
      <div class="primitive">
        <span class="step">02</span>
        <code>withPlugins</code>
        <span class="size">1.0 KB</span>
        <p>Add structure one <code>.use()</code> at a time. Reducers, methods, middleware, read top to bottom, run top to bottom.</p>
      </div>
      <div class="primitive">
        <span class="step">03</span>
        <code>derive</code>
        <span class="size">438 B</span>
        <p>Compose stores into new ones. It tracks which stores you read, not a graph of who depends on whom.</p>
      </div>
    </div>
    <div class="principle-grid">
      <div class="principle">
        <h4>Minimal by default</h4>
        <p>A store starts as <code>get</code>, <code>set</code>, <code>subscribe</code>, nothing else. Methods, reducers, middleware, and derived stores are things you add when you reach for them, not things you start with.</p>
      </div>
      <div class="principle">
        <h4>Explicit, always</h4>
        <p>No proxies, no auto-tracked reactive graph, no immer unless you add it. State only changes where you called <code>set</code> or <code>dispatch</code>.</p>
      </div>
      <div class="principle">
        <h4>Plugins don't wrap</h4>
        <p>Each plugin declares what it adds. Stack ten of them and the chain still reads top-to-bottom, nothing nested to unwind.</p>
      </div>
      <div class="principle">
        <h4>Derived state, no wiring</h4>
        <p><code>derive</code> tracks which stores you read automatically. No selector library, no dependency array to keep in sync by hand.</p>
      </div>
    </div>
  </div>
</section>

<section class="demo">
  <p class="eyebrow">See it for yourself</p>
  <p class="demo-caption"><span class="step">01</span> Declare</p>

```ts
import { createStore } from "@kin-store/core";

const count = createStore(0);

const theme = createStore<"light" | "dark">("light");

type TodoState = {
  items: string[];
  status: "idle" | "loading";
};
const todos = createStore<TodoState>({
  items: [],
  status: "idle",
});
```

<p class="demo-caption"><span class="step">02</span> Read, write, subscribe</p>

```ts
count.set((n) => n + 1);
theme.set("dark");
todos.set((s) => ({ ...s, items: [...s.items, "Buy milk"] }));

console.log(count.get()); // 1

const unsubscribe = count.subscribe((get, prev) => {
  console.log(prev, "->", get());
});
count.set((n) => n + 1); // logs "1 -> 2"
unsubscribe();
```

<p class="demo-caption"><span class="step">03</span> Compose</p>

```ts
import { derive } from "@kin-store/core";

const itemCount = derive((get) => get(todos).items.length);
console.log(itemCount.get()); // 1
```

<p class="demo-caption"><span class="step">04</span> Add structure, only when you want it</p>

```ts
import { withPlugins } from "@kin-store/core";
import { devtools, persist } from "@kin-store/plugins";

const store = withPlugins(todos)
  .use("persist", persist({ key: "todos" }))
  .use("devtools", devtools())
  .use({
    // A plugin is a plain object: methods/reducers/middleware, nothing
    // wraps or patches the store to add them.
    methods: (store) => ({
      addTodo(text: string): void {
        store.set((s) => ({ ...s, items: [...s.items, text] }));
      },
      async fetchTodos(): Promise<void> {
        store.set((s) => ({ ...s, status: "loading" }));
        const items = await api.fetchTodos();
        store.set({ items, status: "idle" });
      },
    }),
  });

await store.persist.hydrate(); // From the namespaced persist plugin.
store.addTodo("Buy milk"); // From the top-level inline plugin.
```

<p class="demo-caption"><span class="step">05</span> Need traceability? Add reducers and replace <code>set</code> by <code>dispatch</code></p>

```ts
const store = withPlugins(todos)
  .use("persist", persist({ key: "todos" }))
  .use("devtools", devtools())
  .use({
    reducers: {
      addTodo: (s, text: string) => ({ ...s, items: [...s.items, text] }),
      fetchStart: (s) => ({ ...s, status: "loading" }),
      fetchDone: (_s, items: string[]) => ({ items, status: "idle" }),
    },
    methods: (store) => ({
      async fetchTodos(): Promise<void> {
        store.dispatch.fetchStart();
        const items = await api.fetchTodos();
        store.dispatch.fetchDone(items);
      },
    }),
  });

store.dispatch.addTodo("Buy milk"); // Full intellisense, logged in devtools.
```

<p class="demo-note"><code>set</code>/<code>dispatch</code> are both first-class here: pick whichever fits this store or method, not a ladder from one to the other.</p>

<p class="demo-caption">In React</p>

```tsx
import { useSelector, useStore } from "@kin-store/react";

function Counter(): JSX.Element {
  const value = useStore(count); // Re-renders on every change.
  return <button onClick={() => count.set((n) => n + 1)}>{value}</button>;
}

function TodoList(): JSX.Element {
  const items = useSelector(store, (s) => s.items); // Re-renders only when items changes.
  return (
    <ul>
      {items.map((item) => <li key={item}>{item}</li>)}

      {/* Direct method reference. No hook, no subscription. */}
      <button onClick={() => store.addTodo("Buy milk")}>Add</button>
    </ul>
  );
}
```

</section>

</div>
