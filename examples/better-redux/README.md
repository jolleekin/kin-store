# Better Redux — Kin Store

Demonstrates `withPlugins` with the **immer** and **persist** plugins:

- `immer` — write reducers with mutable draft syntax; actions are dispatched via
  `store.dispatch.*`
- `persist` — automatically saves state to `localStorage` and restores it on
  load
- Middleware — logs each dispatched action name to the DevTools console

## Stack

[Deno](https://deno.com) · Vite · React · TypeScript · Tailwind CSS

## Running

Requires Deno v2 or later.

```bash
deno task dev
```

## Building

```bash
deno task build      # production bundle → dist/
deno task preview    # preview the production build locally
deno task serve      # serve dist/ with a static file server
```
