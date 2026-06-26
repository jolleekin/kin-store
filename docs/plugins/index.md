# Official Plugins

Official plugins for `@kin-store/core`, published as `@kin-store/plugins`.

## Install

::: code-group

```sh [npm]
npx jsr add @kin-store/plugins
```

```sh [pnpm]
pnpm dlx jsr add @kin-store/plugins
```

```sh [deno]
deno add jsr:@kin-store/plugins
```

:::

## Available plugins

| Plugin | Description |
|---|---|
| [`persist`](/plugins/persist) | Persist state to localStorage (or any custom storage) |
| [`history`](/plugins/history) | Undo / redo / reset with snapshot history |
| [`immer`](/plugins/immer) | Write reducers as Immer draft mutations |

## Usage pattern

All plugins are applied with `.use()`. Namespaced plugins (like `persist` and `history`) expose their methods under their namespace key:

```ts
import { withPlugins } from '@kin-store/core/index.ts'
import { persist, history, immer } from '@kin-store/plugins/index.ts'

const store = withPlugins({ todos: [] as string[], count: 0 })
  .use('persist', persist({ key: 'my-store' }))
  .use('history', history({ limit: 50 }))
  .use(immer({
    reducers: {
      add: (draft, text: string) => { draft.todos.push(text) },
    },
  }))

store.dispatch.add('hello')
store.history.undo()
await store.persist.hydrate()
```
