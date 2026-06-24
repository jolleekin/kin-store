import { withPlugins } from "@kin-store/core/index.ts";
import { immer, persist } from "@kin-store/plugins/index.ts";

export type Filter = "all" | "active" | "done";

export type Todo = {
  id: number;
  text: string;
  done: boolean;
};

export type TodoState = {
  items: Todo[];
  filter: Filter;
};

/**
 * Factory so each client render gets its own store instance — no shared
 * state between SSR requests. Provided to the component tree via StoreProvider.
 */
export function createTodoStore() {
  return withPlugins<TodoState>({ items: [], filter: "all" })
    .use(
      "persist",
      persist({
        key: "nextjs-todo",
        // Skip auto-hydration: localStorage is not available during SSR.
        // Providers.tsx calls store.persist.hydrate() after the client mounts.
        skipHydration: true,
        // Persist only items; filter resets to "all" on every page load.
        selector: (s) => ({ items: s.items }),
      }),
    )
    .use(
      immer({
        reducers: {
          addTodo(draft, text: string) {
            draft.items.push({ id: Date.now(), text, done: false });
          },
          toggleTodo(draft, id: number) {
            const item = draft.items.find((it) => it.id === id);
            if (item) item.done = !item.done;
          },
          removeTodo(draft, id: number) {
            draft.items = draft.items.filter((it) => it.id !== id);
          },
          clearDone(draft) {
            draft.items = draft.items.filter((it) => !it.done);
          },
          setFilter(draft, filter: Filter) {
            draft.filter = filter;
          },
        },
      }),
    );
}

export type TodoStore = ReturnType<typeof createTodoStore>;
