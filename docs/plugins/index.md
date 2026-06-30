# Official Plugins

Official plugins for `@kin-store/core`, published as `@kin-store/plugins`.

To learn how to write your own plugin, see
[Writing Plugins](/guide/writing-plugins).

## Install

::: code-group

```sh [npm]
npx jsr add @kin-store/plugins
```

```sh [pnpm]
pnpm add jsr:@kin-store/plugins
```

```sh [deno]
deno add jsr:@kin-store/plugins
```

:::

## Available plugins

| Plugin                          | Description                                                  |
| ------------------------------- | ------------------------------------------------------------ |
| [`devtools`](/plugins/devtools) | Connects to the Redux DevTools Extension                     |
| [`history`](/plugins/history)   | Undo / redo / reset with snapshot history                    |
| [`immer`](/plugins/immer)       | Writes reducers or `set`'s updaters as Immer draft mutations |
| [`persist`](/plugins/persist)   | Persists state to localStorage (or any custom storage)       |

## Usage pattern

All plugins are registered with `.use()`. Plugins can be top-level or
namespaced. Namespaced plugins (like `persist` and `history` below) expose their
methods under their namespace key:

```ts
import { withPlugins } from "@kin-store/core/index.ts";
import { history, immer, persist } from "@kin-store/plugins/index.ts";

const store = withPlugins({ todos: [] as string[], count: 0 })
  .use("persist", persist({ key: "my-store" }))
  .use("history", history({ limit: 50 }))
  .use(immer({
    reducers: {
      add: (draft, text: string) => {
        draft.todos.push(text);
      },
    },
  }));

await store.persist.hydrate();
store.history.undo();
store.dispatch.add("hello"); // From the top-level inline plugin
```
