import { withPlugins } from "@kin-store/core/index.ts";
import { devtools, immer, persist } from "@kin-store/plugins/index.ts";

export type Filter = "all" | "active" | "done";

export type Todo = Readonly<{
  id: number;
  text: string;
  done: boolean;
}>;

export const todoStore = withPlugins({
  items: [] as Todo[],
  filter: "all" as Filter,
})
  .use("persist", persist({ key: "todos" }))
  .use(import.meta.env.DEV ? devtools() : {})
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

      middleware: () => (ctx, next) => {
        console.log(ctx.reducer);
        return next();
      },
    }),
  );
