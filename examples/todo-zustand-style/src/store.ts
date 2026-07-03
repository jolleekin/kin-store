import { withPlugins } from "@kin-store/core/index.ts";
import { devtools, immer, persist } from "@kin-store/plugins/index.ts";

export type Filter = "all" | "active" | "done";

export type Todo = Readonly<{
  id: number;
  text: string;
  done: boolean;
}>;

export type TodoState = Readonly<{
  items: Todo[];
  filter: Filter;
}>;

export const todoStore = withPlugins({ items: [], filter: "all" } as TodoState)
  .use("persist", persist({ key: "todos" }))
  .use(import.meta.env.DEV ? devtools() : {})
  .use(
    immer({
      methods: ({ set }) => ({
        addTodo(text: string): void {
          set((draft) => {
            draft.items.push({ id: Date.now(), text, done: false });
          });
        },
        toggleTodo(id: number): void {
          set((draft) => {
            const item = draft.items.find((it) => it.id === id);
            if (item) item.done = !item.done;
          });
        },
        removeTodo(id: number): void {
          set((draft) => {
            draft.items = draft.items.filter((it) => it.id !== id);
          });
        },
        clearDone(): void {
          set((draft) => {
            draft.items = draft.items.filter((it) => !it.done);
          });
        },
        setFilter(filter: Filter): void {
          set((draft) => {
            draft.filter = filter;
          });
        },
      }),
    }),
  );
