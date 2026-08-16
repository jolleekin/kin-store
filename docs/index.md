---
layout: home
# Opts out of VPHomeContent's `.vp-doc` prose wrapper (link underlines,
# paragraph spacing, table display, etc.) — this page's markdown supplies
# all its own styling via style.css.
markdownStyles: false
---

<div class="home">

<section class="hero">
  <h1 class="section-header">Kin Store</h1>
  <p class="lede">Start with a plain store. Add structure only when the app earns it.</p>
  <p class="prose">A framework-agnostic reactive state library for TypeScript.</p>
  <div class="actions">
    <a class="btn-primary" href="/guide/getting-started">Get Started</a>
    <a class="btn-secondary" href="https://github.com/jolleekin/kin-store">View on GitHub</a>
  </div>
</section>

<section class="why">
<h2 class="section-header">Why it exists</h2>
<p class="prose">Most state libraries pick your architecture before you know if the app needs one: actions, reducers, selectors, a provider tree, decided on day one. Kin Store leaves that decision to you.</p>
<p class="prose"><code>set</code> and <code>dispatch</code> are equally first-class, not a beginner tier and an advanced one, so the mutation style a store uses is a choice your team makes, not one the library makes for you.</p>
</section>

<section class="system">
<h2 class="section-header">What it does differently</h2>
<div class="system-card">
  <div class="primitive-grid">
    <div class="primitive">
      <span class="step">01</span>
      <code>createStore</code>
      <span class="size">231 B</span>
      <p><code>get</code>, <code>set</code>, <code>subscribe</code>. Nothing else.</p>
    </div>
    <div class="primitive">
      <span class="step">02</span>
      <code>withPlugins</code>
      <span class="size">1.0 KB</span>
      <p>Add methods, reducers, and middleware, one <code>.use()</code> at a time.</p>
    </div>
    <div class="primitive">
      <span class="step">03</span>
      <code>derive</code>
      <span class="size">438 B</span>
      <p>Compose stores into new ones. It tracks what you read, not a graph you maintain.</p>
    </div>
  </div>
  <div class="principle-grid">
    <div class="principle">
      <h3 class="lede">Minimal by default</h3>
      <p>A store starts as <code>get</code>, <code>set</code>, <code>subscribe</code>, nothing else. Methods, reducers, middleware, and derived stores are things you add when you reach for them, not things you start with.</p>
    </div>
    <div class="principle">
      <h3 class="lede">Explicit, always</h3>
      <p>No proxies, no auto-tracked reactive graph, no immer unless you add it. State only changes where you called <code>set</code> or <code>dispatch</code>.</p>
    </div>
    <div class="principle">
      <h3 class="lede">Plugins don't wrap</h3>
      <p>Each plugin declares what it adds. Stack ten of them and the chain still reads top-to-bottom, nothing nested to unwind.</p>
    </div>
    <div class="principle">
      <h3 class="lede">Derived state, no wiring</h3>
      <p><code>derive</code> tracks which stores you read automatically. No selector library, no dependency array to keep in sync by hand.</p>
    </div>
  </div>
</div>
</section>

<section class="fit">
<h2 class="section-header">Is Kin Store a fit?</h2>
<div class="fit-card">
<div>
<h3 class="lede">Use it when state should start minimal.</h3>
<ul>
  <li>State should start minimal, not architected upfront.</li>
  <li>You want typed reducers, middleware, or devtools, only where it matters.</li>
  <li>You want one store that works the same in React, another framework, or plain JS/TS.</li>
</ul>
</div>
<div>
<h3 class="lede">Skip it when the simple thing is enough.</h3>
<ul>
  <li>You need server-owned state: that's TanStack Query's job, not a client store's.</li>
  <li>You need non-React bindings today; Vue, Svelte, and Solid aren't published yet.</li>
  <li>Redux or Zustand already works fine for your team.</li>
</ul>
</div>
</div>
</section>

<section class="numbers">
<h2 class="section-header">How it compares</h2>
<FeatureMatrix />
<p class="numbers-cta">For full comparison, <a href="/comparison/">see the details →</a></p>
</section>

<section class="demo">
<h2 class="section-header">See it for yourself</h2>
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

<p class="demo-caption"><span class="step">04</span> When the store earns it, add structure</p>

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

<p class="demo-caption"><span class="step">05</span> Need traceability? Add reducers and replace <code>set</code> by <code>dispatch</code> for those changes</p>

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
   // Re-renders on every change. Works great for primitive stores.
  const value = useStore(count);
  
  return <button onClick={() => count.set((n) => n + 1)}>{value}</button>;
}

function TodoList(): JSX.Element {
   // Re-renders only when items changes.
  const items = useSelector(store, (s) => s.items);

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
